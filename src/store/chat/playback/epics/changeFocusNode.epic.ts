import { EMPTY, filter, from, switchMap } from 'rxjs';

import { ChatRootEpic } from '@/types/store';

import { MindmapActions } from '../../mindmap/mindmap.reducers';
import { PlaybackActions } from '../playback.reducer';

export const changeFocusNodeEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(PlaybackActions.changeFocusNode.match),
    switchMap(({ payload }) => {
      const {
        elements: nextGraphState,
        visitedNodes: nextVisitedNodes,
        focusNodeId: nextFocusNodeId,
        depth: nextDepth,
      } = payload.action.mindmap;

      if (!nextFocusNodeId || !nextVisitedNodes || !nextGraphState) {
        return EMPTY;
      }

      return from([
        MindmapActions.setVisitedNodes(nextVisitedNodes),
        MindmapActions.setGraphElements(nextGraphState),
        MindmapActions.setFocusNodeId(nextFocusNodeId),
        PlaybackActions.setPlaybackInputText(null),
        MindmapActions.setDepth(nextDepth),
      ]);
    }),
  );
