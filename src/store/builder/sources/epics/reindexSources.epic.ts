import { concat, concatMap, filter, from, map, mergeMap, of } from 'rxjs';

import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { HistoryActions } from '@/store/builder/history/history.reducers';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { handleRequest } from '@/store/builder/utils/handleRequest';
import { HTTPMethod } from '@/types/http';
import { Source, SourceStatus, SourceType } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { SourcesActions, SourcesSelectors } from '../sources.reducers';

export const reindexSourcesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.reindexSources.match),
    map(({ payload: selected }) => ({
      selected,
      appName: ApplicationSelectors.selectApplicationName(state$.value),
      allSources: SourcesSelectors.selectSources(state$.value),
    })),
    mergeMap(({ selected, appName, allSources }) => {
      const updatedAll = allSources.map(source =>
        selected.some(s => s.id === source.id)
          ? { ...source, status: SourceStatus.INPROGRESS, created: undefined, version: undefined }
          : source,
      );
      const initActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        SourcesActions.setSources(updatedAll),
      ];

      const updates$ = from(selected).pipe(
        concatMap(source => {
          const formData = new FormData();
          if (source.type === SourceType.LINK) {
            formData.append('link', source.url);
          }

          const responseProcessor = (resp: Response) =>
            from(resp.json()).pipe(
              concatMap((newSource: Source) => {
                const setSourcesAction = SourcesActions.setSources(
                  SourcesSelectors.selectSources(state$.value).map(s => (s.id === newSource.id ? newSource : s)),
                );
                const subscribeAction = SourcesActions.sourceStatusSubscribe({
                  sourceId: newSource.id!,
                  versionId: newSource.version!,
                });
                return of(setSourcesAction, subscribeAction);
              }),
            );

          return handleRequest({
            url: `/api/mindmaps/${encodeURIComponent(appName)}/documents/${source.id}/versions`,
            options: {
              method: HTTPMethod.POST,
              body: formData,
            },
            state$,
            responseProcessor,
            failureActions: [UIActions.showErrorToast(`Failed to reindex source ${source.id}`)],
            skipContentType: true,
          });
        }),
      );
      return concat(of(...initActions), updates$);
    }),
  );
