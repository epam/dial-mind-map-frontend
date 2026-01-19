import { UnknownAction } from '@reduxjs/toolkit';
import {
  catchError,
  concat,
  concatMap,
  EMPTY,
  filter,
  from,
  map,
  mergeMap,
  of,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';

import { SourceProcessingTimeLimitMs } from '@/constants/app';
import { HTTPMethod } from '@/types/http';
import { Source, SourceStatus, SourceType } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { parseSSEStream } from '@/utils/app/streams';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { SourcesActions, SourcesSelectors } from '../sources.reducers';

export const recreateSourceVersionEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.recreateSourceVersion.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: SourcesSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, name, sources }) => {
      const controller = new AbortController();
      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const type = payload.file ? SourceType.FILE : SourceType.LINK;
      const url = payload.file ? payload.file.name : (payload.link ?? '');

      const updatedSources = sources.reduce((acc: Source[], source) => {
        if (source.id === payload.sourceId && source.version === payload.versionId) {
          return [
            ...acc,
            {
              url,
              type,
              name: url,
              id: payload.sourceId,
              version: payload.versionId,
              active: true,
              status: SourceStatus.INPROGRESS,
            },
          ];
        }
        return [...acc, source];
      }, []);
      optimisticActions.push(SourcesActions.setSources(updatedSources));

      const formData = new FormData();
      if (payload.file) {
        formData.append('file', payload.file);
      } else if (payload.link) {
        formData.append('link', payload.link);
      }

      return concat(
        of(...optimisticActions),
        from(
          fetch(
            `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.sourceId}/versions/${payload.versionId}`,
            {
              method: HTTPMethod.POST,
              signal: controller.signal,
              body: formData,
            },
          ),
        ).pipe(
          mergeMap(resp => checkForUnauthorized(resp)),
          mergeMap(resp => {
            if (!resp.body) {
              return throwError(() => new Error('ReadableStream not supported'));
            }
            const reader = resp.body.getReader();
            const eventObservable = parseSSEStream(reader, controller);

            return eventObservable.pipe(
              timeout(SourceProcessingTimeLimitMs),
              map(data => JSON.parse(data as string) as Source),
              mergeMap(response => {
                const sources = SourcesSelectors.selectSources(state$.value);
                const updatedSources = sources.reduce((acc: Source[], source) => {
                  if (source.id === payload.sourceId && source.version === payload.versionId) {
                    return [...acc, response];
                  }
                  return [...acc, source];
                }, []);

                if (response.status === SourceStatus.INDEXED) {
                  return concat(
                    of(SourcesActions.setSources(updatedSources)),
                    of(SourcesActions.sourceStatusSubscribe({ sourceId: response.id!, versionId: response.version! })),
                  );
                } else {
                  return concat(of(SourcesActions.setSources(updatedSources)));
                }
              }),
              catchError(error => {
                controller.abort();
                if (error instanceof TimeoutError) {
                  return from([UIActions.showErrorToast('Source recreation failed due to exceeding the time limit')]);
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
        ),
      );
    }),
  );
