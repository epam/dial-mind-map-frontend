import { UnknownAction } from '@reduxjs/toolkit';
import { concat, concatMap, EMPTY, filter, from, map, of } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { HTTPMethod } from '@/types/http';
import { Source } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
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
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: Source) => {
            const sources = SourcesSelectors.selectSources(state$.value);
            const sourcesNames = SourcesSelectors.selectSourcesNames(state$.value);

            return concat(
              of(SourcesActions.setSources([...sources, response])),
              of(SourcesActions.setSourcesNames({ ...sourcesNames, [response.id!]: payload.name })),
              of(SourcesActions.sourceStatusSubscribe({ sourceId: response.id!, versionId: response.version! })),
            );
          }),
        );

      const formData = new FormData();
      if (payload.file) {
        formData.append('file', payload.file);
      } else if (payload.link) {
        formData.append('link', payload.link);
      }

      formData.append('name', payload.name);

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(appName)}/documents`,
        {
          method: HTTPMethod.POST,
          body: formData,
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
        [],
        [UIActions.showErrorToast('Failed to add source')],
        responseProcessor,
        true,
      );
    }),
  );
