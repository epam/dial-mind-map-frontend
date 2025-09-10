import {
  catchError,
  concat,
  concatMap,
  EMPTY,
  filter,
  from,
  map,
  mergeMap,
  Observable,
  of,
  take,
  throwError,
} from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { GenerationStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { GraphActions } from '../../graph/graph.reducers';
import { HistoryActions } from '../../history/history.reducers';
import { SourcesActions } from '../../sources/sources.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions } from '../builder.reducers';

export const generationStatusSubscribeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.generationStatusSubscribe.match),
    mergeMap(() => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      return from(
        fetch(`/api/mindmaps/${encodeURIComponent(name)}/generation_status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [MindmapUrlHeaderName]: mindmapFolder,
          },
        }),
      ).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => {
          if (!resp.body) {
            return throwError(() => new Error('ReadableStream not supported'));
          }
          const reader = resp.body.getReader();
          const decoder = new TextDecoder('utf-8');

          const eventObservable = new Observable(observer => {
            const read = async () => {
              try {
                let buffer = '';
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i];
                    if (line.startsWith('data:')) {
                      const jsonData = line.slice(5).trim();
                      observer.next(jsonData);
                    }
                  }
                  buffer = lines[lines.length - 1];
                }
                observer.complete();
              } catch (error) {
                console.error('SSE read error:', error);
                observer.error(error);
              }
            };
            read();
            return () => {
              reader.cancel();
            };
          });

          return eventObservable.pipe(
            map(data => {
              const parsedData = JSON.parse(data as string);
              if (parsedData.time) {
                const messageTimeMs = parsedData.time * 1000;
                const currentTimeMs = Date.now();
                const timeDiff = currentTimeMs - messageTimeMs;
                if (parsedData.error) {
                  return {
                    isComplete: false,
                    statusAction: BuilderActions.setGeneratingStatus({
                      isError: true,
                      title: 'Graph generation error',
                      details: parsedData.user_friendly ? parsedData.error : undefined,
                    }),
                  };
                }
                if (timeDiff > 3 * 60 * 1000) {
                  return {
                    isComplete: false,
                    statusAction: BuilderActions.setGeneratingStatus({
                      isError: true,
                      title: 'Graph generation error',
                      details: parsedData.user_friendly ? parsedData.error : undefined,
                    }),
                  };
                }
              }

              if (parsedData.etag) {
                return { isComplete: true };
              } else if (parsedData.error) {
                return {
                  isComplete: false,
                  statusAction: BuilderActions.setGeneratingStatus({
                    isError: true,
                    title: 'Graph generation error',
                    details: parsedData.user_friendly ? parsedData.error : undefined,
                  }),
                };
              } else {
                return {
                  isComplete: false,
                  statusAction: BuilderActions.setGeneratingStatus(parsedData),
                };
              }
            }),
            concatMap(({ isComplete, statusAction }) => {
              if (isComplete) {
                return concat(of(BuilderActions.generationComplete()));
              } else if (statusAction) {
                return of(statusAction);
              }
              return EMPTY;
            }),
            catchError(error => {
              console.warn('SSE processing error:', error);
              return EMPTY;
            }),
          );
        }),
        globalCatchUnauthorized(),
        catchError(error => {
          console.warn('generationStatusSubscribe Error:', error);
          return EMPTY;
        }),
      );
    }),
  );

export const generationCompleteEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(BuilderActions.generationComplete.match),
    mergeMap(() => {
      return concat(
        of(GraphActions.setGraphReady(false)),
        of(BuilderActions.fetchGraph()),
        of(SourcesActions.fetchSources()),
        of(HistoryActions.fetchUndoRedo()),
        of(BuilderActions.setGenerationStatus(GenerationStatus.FINISHED)),
        action$.pipe(
          filter(BuilderActions.fetchGraphSuccess.match),
          take(1),
          mergeMap(() =>
            concat(
              of(UIActions.setAreGeneretedEdgesShowen({ value: true, skipRefresh: true })),
              of(GraphActions.setGraphReady(true)),
            ),
          ),
        ),
      );
    }),
  );
