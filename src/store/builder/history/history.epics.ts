import { UnknownAction } from '@reduxjs/toolkit';
import { combineEpics } from 'redux-observable';
import { concat, concatMap, EMPTY, filter, from, of } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { ExtendedUndoRedo, UndoRedo } from '@/types/common';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../application/application.reducer';
import { UIActions } from '../ui/ui.reducers';
import { handleHistoryGraphResponse } from '../utils/handleHistoryGraphResponse';
import { handleRequest, handleRequestNew } from '../utils/handleRequest';
import { handleSourcesResponse } from '../utils/handleSourcesResponse';
import { HistoryActions } from './history.reducers';

export const fetchUndoRedoEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(HistoryActions.fetchUndoRedo.match),
    concatMap(() => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: UndoRedo) => {
            return concat(of(HistoryActions.setIsRedo(response.redo)), of(HistoryActions.setIsUndo(response.undo)));
          }),
        );

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/history`,
        { method: HTTPMethod.GET, headers: { [MindmapUrlHeaderName]: mindmapFolder } },
        state$,
        [],
        [],
        [],
        responseProcessor,
      );
    }),
  );

export const applyActionEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(HistoryActions.applyAction.match),
    concatMap(({ payload: action }) => {
      const name = ApplicationSelectors.selectApplicationName(state$.value);
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);

      if (!mindmapFolder) {
        return EMPTY;
      }

      const optimisticActions = [HistoryActions.setIsRedo(false), HistoryActions.setIsUndo(false)];

      const responseProcessor = (resp: Response) =>
        from(resp.json()).pipe(
          concatMap((response: ExtendedUndoRedo) => {
            const baseActions: UnknownAction[] = [
              HistoryActions.setIsRedo(response.redo),
              HistoryActions.setIsUndo(response.undo),
            ];

            const sourcesActions$ = response.sources ? handleSourcesResponse(response.sources, [], null) : EMPTY;
            const graphActions$ = response.graph ? handleHistoryGraphResponse(response.graph, []) : EMPTY;
            const isGenerated = response.sources?.generated;

            if ((response.sources && !response.graph) || (isGenerated !== undefined && !isGenerated)) {
              baseActions.push(UIActions.softNavigateTo('sources'));
            } else if (response.graph) {
              baseActions.push(UIActions.softNavigateTo('content'));
            }

            return concat(from(baseActions), sourcesActions$, graphActions$);
          }),
        );

      return handleRequestNew({
        url: `/api/mindmaps/${encodeURIComponent(name)}/history?action=${action}`,
        options: { method: HTTPMethod.POST, headers: { [MindmapUrlHeaderName]: mindmapFolder } },
        state$,
        optimisticActions,
        responseProcessor,
        failureActions: [
          UIActions.showErrorToast(`Unable to ${action} the last action. Please refresh or try again later.`),
        ],
      });
    }),
  );

export const HistoryEpics = combineEpics(fetchUndoRedoEpic, applyActionEpic);
