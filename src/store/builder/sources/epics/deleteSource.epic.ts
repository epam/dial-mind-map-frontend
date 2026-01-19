import { concat, concatMap, filter, from, map, of } from 'rxjs';

import { HTTPMethod } from '@/types/http';
import { SourceType } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { SourcesActions, SourcesSelectors } from '../sources.reducers';
import { handleSourceDelete } from './utils/handleSourceDelete';

export const deleteSourceEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.deleteSource.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: SourcesSelectors.selectSources(state$.value),
    })),
    concatMap(({ payload, name }) => {
      const optimisticActions = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const fileName = payload.type === SourceType.FILE ? payload.url.split('/').at(-1) : undefined;
      const url =
        payload.type === SourceType.FILE && fileName
          ? `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.id}?fileName=${encodeURIComponent(fileName)}`
          : `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.id}`;

      const responseProcessor = (resp: Response) =>
        from(resp.text()).pipe(
          concatMap(() => {
            const sources = SourcesSelectors.selectSources(state$.value);
            const updatedSources = handleSourceDelete(sources, payload.id!);
            return concat(of(SourcesActions.setSources(updatedSources)));
          }),
        );

      return handleRequest({
        url,
        options: { method: HTTPMethod.DELETE },
        state$,
        optimisticActions,
        responseProcessor,
      });
    }),
  );
