import { UnknownAction } from '@reduxjs/toolkit';
import { concat, concatMap, EMPTY, filter, from, map, of } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { HTTPMethod } from '@/types/http';
import { Source, SourceStatus, SourceType } from '@/types/sources';
import { BuilderRootEpic } from '@/types/store';
import { uuidv4 } from '@/utils/common/uuid';

import { ApplicationSelectors } from '../../application/application.reducer';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { SourcesActions, SourcesSelectors } from '../sources.reducers';

export const createSourceVersionEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(SourcesActions.createSourceVersion.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      sources: SourcesSelectors.selectSources(state$.value),
      mindmapFolder: ApplicationSelectors.selectMindmapFolder(state$.value),
    })),
    concatMap(({ payload, name, sources, mindmapFolder }) => {
      if (!mindmapFolder) {
        return EMPTY;
      }

      const optimisticActions: UnknownAction[] = [HistoryActions.setIsUndo(true), HistoryActions.setIsRedo(false)];

      const tempId = uuidv4();

      const type = payload.file ? SourceType.FILE : SourceType.LINK;
      const url = payload.file ? payload.file.name : (payload.link ?? '');

      const updatedSources = sources.reduce((acc: Source[], source) => {
        if (source.id === payload.sourceId && source.active) {
          return [
            ...acc,
            { ...source, active: false },
            { url, type, name: url, id: tempId, active: true, status: SourceStatus.INPROGRESS },
          ];
        }
        return [...acc, source];
      }, []);
      optimisticActions.push(SourcesActions.setSources(updatedSources));

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: Source) => {
            const sources = SourcesSelectors.selectSources(state$.value);

            const updated = sources.reduce((acc: Source[], source) => {
              if (source.id === tempId) {
                return [...acc, response];
              }
              return [...acc, source];
            }, []);

            return concat(
              of(SourcesActions.setSources(updated)),
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

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/documents/${payload.sourceId}/versions`,
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
