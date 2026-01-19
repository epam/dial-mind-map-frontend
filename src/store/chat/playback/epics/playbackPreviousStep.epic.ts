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
      playbackConversation: PlaybackSelectors.selectPlaybackConversation(state$.value),
    })),
    switchMap(({ conversation, playbackActions, playbackStepNumber, playbackConversation }) => {
      if (playbackStepNumber <= 0) return EMPTY;

      const previousStepNumber = playbackStepNumber - 1;
      const previousAction = playbackActions?.[previousStepNumber];
      const lastAction = playbackActions?.[playbackStepNumber];

      const actionBeforePrevious = playbackActions?.[previousStepNumber - 1];

      if (!previousAction || !lastAction) return EMPTY;

      const actions: UnknownAction[] = [PlaybackActions.setStepNumber(previousStepNumber)];

      const message =
        conversation.playback?.messagesStack.find(message => message.id === previousAction.mindmap.focusNodeId) || null;
      const inputValue =
        previousAction?.type === PlaybackActionType.FillInput
          ? previousAction?.chat?.userMessage || message?.content || null
          : '';

      if (previousAction.type === PlaybackActionType.Init) {
        return from([
          PlaybackActions.setPlaybackInputText(null),
          MindmapActions.setVisitedNodes(previousAction.mindmap.visitedNodes),
          MindmapActions.setGraphElements(previousAction.mindmap.elements),
          MindmapActions.setFocusNodeId(lastAction.mindmap.visitedNodes?.[lastAction.mindmap.focusNodeId]),
          MindmapActions.setDepth(previousAction.mindmap.depth),
          PlaybackActions.setStepNumber(0),
          PlaybackActions.init({ ...conversation, messages: conversation.playback?.messagesStack.slice(0, 2) ?? [] }),
        ]);
      }

      if (lastAction.type === PlaybackActionType.FillInput) {
        actions.push(PlaybackActions.setPlaybackInputText(null));
        return from(actions);
      }

      const focusNodeId =
        actionBeforePrevious?.type === PlaybackActionType.Init
          ? previousAction.mindmap.visitedNodes?.[previousAction.mindmap.focusNodeId]
          : (actionBeforePrevious?.mindmap.focusNodeId ?? previousAction.mindmap.focusNodeId);

      const elements = actionBeforePrevious?.mindmap.elements ?? previousAction.mindmap.elements;
      const depth = actionBeforePrevious?.mindmap.depth ?? previousAction.mindmap.depth;
      const visitedNodes = actionBeforePrevious?.mindmap.visitedNodes ?? previousAction.mindmap.visitedNodes;

      if (lastAction.type === PlaybackActionType.UpdateConversation) {
        if (previousAction.type === PlaybackActionType.AIGenerateMessage && playbackConversation) {
          const rollBackActions: UnknownAction[] = [PlaybackActions.setStepNumber(previousStepNumber - 1)];

          const botMessage = previousAction.chat?.previousMessage;
          const trimmedMessages = playbackConversation.messages.slice(0, -2);
          const messages = [...trimmedMessages];
          const userMessage = conversation.playback?.messagesStack.findLast(message => message.role === 'user');
          if (userMessage) {
            messages.push({ ...userMessage, id: previousAction.mindmap.focusNodeId });
          }
          if (botMessage) {
            messages.push(botMessage);
          }

          rollBackActions.push(
            MindmapActions.setVisitedNodes(previousAction.mindmap.visitedNodes),
            MindmapActions.setGraphElements(previousAction.mindmap.elements),
            MindmapActions.setFocusNodeId(previousAction.mindmap.focusNodeId),
            MindmapActions.setDepth(previousAction.mindmap.depth),
            PlaybackActions.setPlaybackConversation({
              ...playbackConversation,
              messages,
            }),
            PlaybackActions.setPlaybackInputText(null),
          );
          return from(rollBackActions);
        }

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
          PlaybackActions.setPlaybackInputText(inputValue),
        );
        return from(actions);
      }

      return EMPTY;
    }),
  );
