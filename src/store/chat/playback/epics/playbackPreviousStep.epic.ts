import { UnknownAction } from '@reduxjs/toolkit';
import { EMPTY, filter, from, map, switchMap } from 'rxjs';

import { PlaybackActionType } from '@/types/chat';
import { ChatRootEpic } from '@/types/store';

import { ConversationSelectors } from '../../conversation/conversation.reducers';
import { MindmapActions } from '../../mindmap/mindmap.reducers';
import { PlaybackActions, PlaybackSelectors } from '../playback.reducer';

export const playbackPreviousStepEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(PlaybackActions.playbackPreviousStep.match),
    map(() => ({
      conversation: ConversationSelectors.selectConversation(state$.value),
      playbackActions: ConversationSelectors.selectPlaybackActions(state$.value),
      playbackStepNumber: PlaybackSelectors.selectStepNumber(state$.value),
    })),
    switchMap(({ conversation, playbackActions, playbackStepNumber }) => {
      if (playbackStepNumber <= 0) return EMPTY;

      const previousStepNumber = playbackStepNumber - 1;
      const previousAction = playbackActions?.[previousStepNumber];
      const lastAction = playbackActions?.[playbackStepNumber];

      const actionBeforePrevious = playbackActions?.[previousStepNumber - 1];

      if (!previousAction || !lastAction) return EMPTY;

      const actions: UnknownAction[] = [PlaybackActions.setStepNumber(previousStepNumber)];

      if (lastAction.type === PlaybackActionType.FillInput) {
        actions.push(PlaybackActions.setPlaybackInputText(null));
        return from(actions);
      }

      const focusNodeId =
        actionBeforePrevious?.type === PlaybackActionType.Init
          ? previousAction.mindmap.visitedNodes?.[previousAction.mindmap.focusNodeId]
          : (actionBeforePrevious?.mindmap.focusNodeId ?? previousAction.mindmap.focusNodeId);
      const inputValue =
        conversation.playback?.messagesStack.find(message => message.id === previousAction.mindmap.focusNodeId)
          ?.content || '';
      const elements = actionBeforePrevious?.mindmap.elements ?? previousAction.mindmap.elements;
      const depth = actionBeforePrevious?.mindmap.depth ?? previousAction.mindmap.depth;
      const visitedNodes = actionBeforePrevious?.mindmap.visitedNodes ?? previousAction.mindmap.visitedNodes;

      if (lastAction.type === PlaybackActionType.UpdateConversation) {
        actions.push(PlaybackActions.revertConversation());

        actions.push(
          PlaybackActions.setPlaybackInputText(inputValue),
          MindmapActions.setVisitedNodes(visitedNodes),
          MindmapActions.setGraphElements(elements),
          MindmapActions.setFocusNodeId(focusNodeId),
          MindmapActions.setDepth(depth),
        );

        return from(actions);
      }

      if (lastAction.type === PlaybackActionType.ChangeFocusNode) {
        actions.push(
          PlaybackActions.setPlaybackInputText(inputValue),
          MindmapActions.setVisitedNodes(visitedNodes),
          MindmapActions.setGraphElements(elements),
          MindmapActions.setFocusNodeId(focusNodeId),
          MindmapActions.setDepth(depth),
        );

        return from(actions);
      }

      if (lastAction.type === PlaybackActionType.ChangeDepth) {
        actions.push(
          MindmapActions.setDepth(previousAction.mindmap.depth),
          MindmapActions.setVisitedNodes(previousAction.mindmap.visitedNodes),
          MindmapActions.setGraphElements(previousAction.mindmap.elements),
          MindmapActions.setFocusNodeId(previousAction.mindmap.focusNodeId),
        );
        return from(actions);
      }

      return EMPTY;
    }),
  );
