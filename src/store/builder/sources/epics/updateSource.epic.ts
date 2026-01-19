import { concatMap, filter, from, map } from 'rxjs';

import { HTTPMethod } from '@/types/http';
import { Source } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { SourcesActions, SourcesSelectors } from '../sources.reducers';

export const updateSourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.updateSource.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: SourcesSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, name, sources }) => {
      const updatedSources = sources.map(s => (s.id === payload.id ? { ...payload, status: undefined } : s));

      const optimisticActions = [
        SourcesActions.setSources(updatedSources),
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
      ];

      const failureActions = [UIActions.showErrorToast('Failed to update source'), SourcesActions.setSources(sources)];

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          map((serverSource: Source) =>
            SourcesActions.setSources(sources.map(s => (s.id === serverSource.id ? serverSource : s))),
          ),
        );

      return handleRequest({
        url: `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.id}`,
        options: {
          method: HTTPMethod.PUT,
          body: JSON.stringify({
            url: payload.url,
            type: payload.type,
          }),
        },
        state$,
        optimisticActions,
        failureActions,
        responseProcessor,
      });
    }),
  );
