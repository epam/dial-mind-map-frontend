import { UnknownAction } from '@reduxjs/toolkit';
import { EMPTY, filter, from, map, switchMap } from 'rxjs';

import { PlaybackActionType } from '@/types/chat';
import { ChatRootEpic } from '@/types/store';

import { ConversationSelectors } from '../../conversation/conversation.reducers';
import { MindmapActions } from '../../mindmap/mindmap.reducers';
import { PlaybackActions, PlaybackSelectors } from '../playback.reducer';

/**
 * Find first action AFTER `start` that matches predicate,
 * but stop when you hit the next UpdateConversation (exclusive).
 */
function findNextUntilNextUpdate<T extends { type: PlaybackActionType }>(
  actions: readonly T[] | undefined,
  start: number,
  predicate: (a: T) => boolean,
): number | null {
  if (!actions) return null;
  for (let i = start + 1; i < actions.length; i++) {
    const a = actions[i];
    if (a.type === PlaybackActionType.UpdateConversation) return null;
    if (predicate(a)) return i;
  }
  return null;
}

export const playbackNextStepEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(PlaybackActions.playbackNextStep.match),
    map(({ payload }) => ({
      conversation: ConversationSelectors.selectConversation(state$.value),
      playbackActions: ConversationSelectors.selectPlaybackActions(state$.value),
      playbackStepNumber: PlaybackSelectors.selectStepNumber(state$.value),
      playbackConversation: PlaybackSelectors.selectPlaybackConversation(state$.value),
      afterAiGenerate: payload?.afterAiGenerate,
    })),
    switchMap(({ conversation, playbackActions, playbackStepNumber, playbackConversation, afterAiGenerate }) => {
      const nextStepNumber = playbackStepNumber + 1;
      const nextAction = playbackActions?.[nextStepNumber];
      if (!nextAction) {
        return EMPTY;
      }
      const actions: UnknownAction[] = [PlaybackActions.setStepNumber(nextStepNumber)];

      if (nextAction.type === PlaybackActionType.AIGenerateMessage && playbackConversation) {
        const messages = playbackConversation?.messages ?? [];
        const trimmed = messages.length > 0 ? messages.slice(0, -2) : messages;

        actions.push(
          PlaybackActions.setPlaybackConversation({ ...playbackConversation, messages: trimmed }),
          PlaybackActions.playbackNextStep({ afterAiGenerate: true }),
        );

        return from(actions);
      }

      if (nextAction.type === PlaybackActionType.FillInput) {
        const message = conversation.playback?.messagesStack.find(
          message => message.id === nextAction.mindmap.focusNodeId,
        );
        const inputValue = nextAction.chat?.userMessage ?? message?.content ?? '';

        actions.push(PlaybackActions.setPlaybackInputText(inputValue));
      }

      if (nextAction.type === PlaybackActionType.UpdateConversation) {
        const aiIdx = findNextUntilNextUpdate(
          playbackActions,
          nextStepNumber,
          a => a.type === PlaybackActionType.AIGenerateMessage,
        );
        const previousMessage = playbackActions?.[aiIdx ?? -1 - 1]?.chat?.previousMessage;
        const previousFocusNodeId = playbackActions?.[aiIdx ?? -1 - 1]?.mindmap?.focusNodeId;
        const previousGraphElements = playbackActions?.[aiIdx ?? -1 - 1]?.mindmap?.elements;

        actions.push(
          PlaybackActions.updateConversation({
            action: nextAction,
            message: previousMessage,
            afterAiGenerate,
            previousFocusNodeId,
            previousGraphElements,
          }),
        );
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
