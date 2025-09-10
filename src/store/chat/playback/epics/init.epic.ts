import { UnknownAction } from '@reduxjs/toolkit';
import { concat, filter, Observable, of, switchMap } from 'rxjs';

import { ChatRootEpic } from '@/types/store';

import { MindmapActions, MindmapInitialState } from '../../mindmap/mindmap.reducers';
import { PlaybackActions } from '../playback.reducer';

export const initEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(PlaybackActions.init.match),
    switchMap(({ payload }) => {
      if (!payload.playback?.customViewState?.playbackActions?.[0]) {
        return of(PlaybackActions.setIsPlaybackUnavailable(true));
      }

      const {
        elements: graphElements,
        visitedNodes: visitedNodeIds,
        focusNodeId,
        depth,
      } = payload.playback.customViewState.playbackActions[0].mindmap;

      const actions: Observable<UnknownAction>[] = [
        of(
          PlaybackActions.setPlaybackConversation({ ...payload, messages: payload.playback.messagesStack.slice(0, 2) }),
        ),
        of(
          MindmapActions.init({
            ...MindmapInitialState,
            elements: graphElements,
            isReady: true,
            focusNodeId: focusNodeId,
            visitedNodes: visitedNodeIds,
            isNotFound: false,
            isRootNodeNotFound: false,
            depth: depth,
          }),
        ),
      ];

      return concat(...actions);
    }),
  );
