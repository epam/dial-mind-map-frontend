import { UnknownAction } from '@reduxjs/toolkit';
import { EMPTY, filter, from, map, switchMap } from 'rxjs';

import { PlaybackActionType } from '@/types/chat';
import { ChatRootEpic } from '@/types/store';

import { ConversationSelectors } from '../../conversation/conversation.reducers';
import { MindmapActions } from '../../mindmap/mindmap.reducers';
import { PlaybackActions, PlaybackSelectors } from '../playback.reducer';

export const playbackNextStepEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(PlaybackActions.playbackNextStep.match),
    map(() => ({
      conversation: ConversationSelectors.selectConversation(state$.value),
      playbackActions: ConversationSelectors.selectPlaybackActions(state$.value),
      playbackStepNumber: PlaybackSelectors.selectStepNumber(state$.value),
    })),
    switchMap(({ conversation, playbackActions, playbackStepNumber }) => {
      const nextStepNumber = playbackStepNumber + 1;
      const nextAction = playbackActions?.[nextStepNumber];
      if (!nextAction) {
        return EMPTY;
      }
      const actions: UnknownAction[] = [PlaybackActions.setStepNumber(nextStepNumber)];

      if (nextAction.type === PlaybackActionType.FillInput) {
        const inputValue =
          conversation.playback?.messagesStack.find(message => message.id === nextAction.mindmap.focusNodeId)
            ?.content || '';

        actions.push(PlaybackActions.setPlaybackInputText(inputValue));
      }

      if (nextAction.type === PlaybackActionType.UpdateConversation) {
        actions.push(PlaybackActions.updateConversation({ action: nextAction }));
      }

      if (nextAction.type === PlaybackActionType.ChangeFocusNode) {
        actions.push(PlaybackActions.changeFocusNode({ action: nextAction }));
      }

      if (nextAction.type === PlaybackActionType.ChangeDepth) {
        actions.push(
          MindmapActions.setDepth(nextAction.mindmap.depth),
          MindmapActions.setVisitedNodes(nextAction.mindmap.visitedNodes),
          MindmapActions.setGraphElements(nextAction.mindmap.elements),
          MindmapActions.setFocusNodeId(nextAction.mindmap.focusNodeId),
        );
      }

      return from(actions);
    }),
  );
