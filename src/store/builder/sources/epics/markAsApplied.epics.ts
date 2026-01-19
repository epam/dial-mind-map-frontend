import { concat, concatMap, filter, from, map, of } from 'rxjs';

import { HTTPMethod } from '@/types/http';
import { SourceStatus } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { SourcesActions, SourcesSelectors } from '../sources.reducers';

export const markAsAppliedEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.markAsApplied.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: SourcesSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, name }) => {
      const optimisticActions = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const url = `/api/mindmaps/${encodeURIComponent(name)}/apply`;

      const responseProcessor = (resp: Response) =>
        from(resp.text()).pipe(
          concatMap(() => {
            const sources = SourcesSelectors.selectSources(state$.value);
            const removedSources = sources.filter(source => source.status === SourceStatus.REMOVED);
            const updatedSources = sources
              .map(s => {
                if (s.id && payload.ids.includes(s.id)) {
                  return { ...s, in_graph: true };
                }
                return s;
              })
              .filter(
                source =>
                  !removedSources.find(
                    removedSource =>
                      removedSource.id && removedSource.id === source.id && payload.ids.includes(removedSource.id),
                  ),
              );
            return concat(of(SourcesActions.setSources(updatedSources)));
          }),
        );

      const body = JSON.stringify({ sources: payload.ids });

      return handleRequest({
        url,
        options: { method: HTTPMethod.POST, body },
        state$,
        optimisticActions,
        responseProcessor,
      });
    }),
  );
