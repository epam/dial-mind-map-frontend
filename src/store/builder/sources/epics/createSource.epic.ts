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
import { Source, SourceStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { parseSSEStream } from '@/utils/app/streams';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { SourcesActions, SourcesSelectors } from '../sources.reducers';

export const createSourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.createSource.match),
    map(({ payload }) => ({
      payload,
      appName: ApplicationSelectors.selectApplicationName(state$.value),
      sources: SourcesSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, appName }) => {
      const controller = new AbortController();
      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const formData = new FormData();
      if (payload.file) {
        formData.append('file', payload.file);
      } else if (payload.link) {
        formData.append('link', payload.link);
      }

      return concat(
        of(...optimisticActions),
        from(
          fetch(`/api/mindmaps/${encodeURIComponent(appName)}/documents`, {
            method: HTTPMethod.POST,
            signal: controller.signal,
            body: formData,
          }),
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
                const sourcesNames = SourcesSelectors.selectSourcesNames(state$.value);

                const idxToUpdate = sources.findIndex(s => s.id === response.id && s.version === response.version);

                const updatedSources =
                  idxToUpdate !== -1
                    ? sources.map((source, i) => (i === idxToUpdate ? response : source))
                    : [...sources, response];

                const updatedSourcesNames = {
                  ...sourcesNames,
                  [response.id!]: payload.name,
                };

                const baseActions = [
                  SourcesActions.setSources(updatedSources),
                  SourcesActions.setSourcesNames(updatedSourcesNames),
                ];

                const extraActions =
                  response.status === SourceStatus.INDEXED
                    ? [
                        SourcesActions.sourceStatusSubscribe({
                          sourceId: response.id!,
                          versionId: response.version!,
                        }),
                      ]
                    : [];

                return concat(of(...baseActions), of(...extraActions));
              }),
              catchError(error => {
                controller.abort();
                if (error instanceof TimeoutError) {
                  return from([UIActions.showErrorToast('Source creation failed due to exceeding the time limit')]);
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
