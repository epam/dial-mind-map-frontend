import { UnknownAction } from '@reduxjs/toolkit';
import { concat, concatMap, filter, from, map, of } from 'rxjs';

import { HTTPMethod } from '@/types/http';
import { Source, SourceStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { SourcesActions, SourcesSelectors } from '../sources.reducers';

export const setActiveSourceVersionEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.setActiveSourceVersion.match),
    map(({ payload }) => ({
      payload,
      appName: ApplicationSelectors.selectApplicationName(state$.value),
      sources: SourcesSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, appName, sources }) => {
      const { sourceId, versionId } = payload;

      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      let targetVersionStatus: SourceStatus | undefined;

      const updatedSources = sources.reduce((acc: Source[], source) => {
        if (source.id === payload.sourceId && source.version === payload.versionId) {
          targetVersionStatus = source.status;
          return [...acc, { ...source, status: SourceStatus.INPROGRESS }];
        }
        return [...acc, source];
      }, []);

      optimisticActions.push(SourcesActions.setSources(updatedSources));

      const responseProcessor = (resp: Response) =>
        from(resp.text()).pipe(
          concatMap(() => {
            const sources = SourcesSelectors.selectSources(state$.value);
            const updatedSources = sources.reduce((acc: Source[], source) => {
              if (source.id === payload.sourceId) {
                if (source.active) {
                  return [...acc, { ...source, active: false }];
                } else if (source.version === payload.versionId) {
                  const updatedSource = { ...source, active: true };
                  if (targetVersionStatus) {
                    updatedSource.status = targetVersionStatus;
                  }
                  return [...acc, updatedSource];
                }
              }
              return [...acc, source];
            }, []);

            return concat(of(SourcesActions.setSources(updatedSources)));
          }),
        );

      const failureActions: UnknownAction[] = [UIActions.showErrorToast('Failed to update the active source version')];

      if (targetVersionStatus) {
        const failureSourcesUpdate = sources.reduce((acc: Source[], source) => {
          if (source.id === payload.sourceId && source.version === payload.versionId) {
            return [...acc, { ...source, status: targetVersionStatus }];
          }
          return [...acc, source];
        }, []);
        failureActions.push(SourcesActions.setSources(failureSourcesUpdate));
      }

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(appName)}/documents/${sourceId}/versions/${versionId}/active`,
        options: {
          method: HTTPMethod.POST,
        },
        state$,
        optimisticActions,
        failureActions,
        responseProcessor,
      });
    }),
  );
