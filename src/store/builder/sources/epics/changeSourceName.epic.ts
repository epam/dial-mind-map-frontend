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

export const changeSourceNameEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.changeSourceName.match),
    map(({ payload }) => ({
      payload,
      appName: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ payload, appName }) => {
      const sourcesNames = SourcesSelectors.selectSourcesNames(state$.value);
      const sources = SourcesSelectors.selectSources(state$.value);
      let realSourceStatus: SourceStatus | undefined;

      const updatedSources = sources.reduce((acc: Source[], source) => {
        if (source.id === payload.sourceId && source.active) {
          realSourceStatus = source.status;
          return [...acc, { ...source }];
        }
        return [...acc, source];
      }, []);

      const optimisticActions: UnknownAction[] = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        SourcesActions.setSourcesNames({ ...sourcesNames, [payload.sourceId]: payload.name }),
        SourcesActions.setSources(updatedSources),
      ];

      const responseProcessor = (resp: Response) =>
        from(resp.text()).pipe(
          concatMap(() => {
            const sources = SourcesSelectors.selectSources(state$.value);
            const updatedSources = sources.reduce((acc: Source[], source) => {
              if (source.id === payload.sourceId && source.active) {
                return [...acc, { ...source, status: realSourceStatus ?? SourceStatus.INDEXED }];
              }
              return [...acc, source];
            }, []);

            return concat(of(SourcesActions.setSources(updatedSources)));
          }),
        );

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(appName)}/documents/${payload.sourceId}`,
        options: {
          method: HTTPMethod.POST,
          body: JSON.stringify({ name: payload.name }),
        },
        state$,
        optimisticActions,
        failureActions: [UIActions.showErrorToast('Failed to change the source name')],
        responseProcessor,
        skipContentType: true,
      });
    }),
  );
