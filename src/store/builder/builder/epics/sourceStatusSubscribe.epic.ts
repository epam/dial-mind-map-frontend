import {
  catchError,
  EMPTY,
  filter,
  from,
  map,
  mergeMap,
  Observable,
  of,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';

import { SourceProcessingTimeLimitMs } from '@/constants/app';
import { MindmapUrlHeaderName } from '@/constants/http';
import { Source, SourceStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { generateMindmapFolderPath } from '@/utils/app/application';

import { ApplicationSelectors } from '../../application/application.reducer';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions, BuilderSelectors } from '../builder.reducers';

export const sourceStatusSubscribeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.sourceStatusSubscribe.match),
    mergeMap(({ payload }) => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const application = ApplicationSelectors.selectApplication(state$.value);
      const mindmapFolder = generateMindmapFolderPath(application);

      const { sourceId, versionId } = payload;

      const controller = new AbortController();

      return from(
        fetch(`/api/mindmaps/${encodeURIComponent(name)}/documents/${sourceId}/versions/${versionId}/events`, {
          method: 'GET',
          signal: controller.signal,
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
                      try {
                        observer.next(jsonData);
                      } catch {
                        observer.error('Error parsing JSON');
                      }
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
              controller.abort();
              reader.cancel();
            };
          });

          return eventObservable.pipe(
            timeout(SourceProcessingTimeLimitMs),
            map(data => JSON.parse(data as string) as Source),
            mergeMap(response => {
              const sources = BuilderSelectors.selectSources(state$.value);
              const updatedSources = sources.reduce((acc: Source[], s) => {
                if (s.id === response.id && s.version === response.version) {
                  return [...acc, response];
                }
                return [...acc, s];
              }, []);

              return of(BuilderActions.setSources(updatedSources));
            }),
            catchError(error => {
              if (error instanceof TimeoutError) {
                const sources = BuilderSelectors.selectSources(state$.value);
                const updatedSources = sources.reduce((acc: Source[], s) => {
                  if (s.id === payload.sourceId && s.version === payload.versionId) {
                    return [
                      ...acc,
                      {
                        ...s,
                        status: SourceStatus.FAILED,
                        status_description: 'Source processing failed due to exceeding the time limit',
                      },
                    ];
                  }
                  return [...acc, s];
                }, []);

                return from([
                  UIActions.showErrorToast('Source processing failed due to exceeding the time limit'),
                  BuilderActions.setSources(updatedSources),
                ]);
              } else {
                console.warn('SSE processing error:', error);
              }

              return EMPTY;
            }),
          );
        }),
        globalCatchUnauthorized(),
        catchError(error => {
          console.warn('sourceCreationSubscribe Error:', error);
          return EMPTY;
        }),
      );
    }),
  );
