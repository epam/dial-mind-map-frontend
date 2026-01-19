import { concat, filter, map, of, switchMap } from 'rxjs';

import { Conversation, Message, PlaybackAction, PlaybackActionType, Role, ViewState } from '@/types/chat';
import { EntityType } from '@/types/common';
import { ChatRootEpic } from '@/types/store';
import { cleanGraphElementsForPlayback } from '@/utils/app/clean';
import { getNodeResponseId } from '@/utils/app/conversation';

import { MindmapSelectors } from '../../mindmap/mindmap.reducers';
import { ConversationActions, ConversationSelectors } from '../conversation.reducers';

export const sendMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.sendMessage.match),
    map(({ payload }) => ({
      payload,
      conversation: ConversationSelectors.selectConversation(state$.value),
    })),
    map(({ payload, conversation }) => {
      const messageModel: Message[EntityType.Model] = {
        id: conversation.model.id,
      };
      const messageSettings: Message['settings'] = {
        prompt: conversation.prompt,
        temperature: conversation.temperature,
      };

      const assistantMessage: Message = {
        id: getNodeResponseId(payload.message.id!),
        content: '',
        model: messageModel,
        settings: messageSettings,
        role: Role.Assistant,
      };

      const userMessage: Message = {
        ...payload.message,
        model: messageModel,
        settings: messageSettings,
      };

      const currentMessages =
        payload.deleteCount && payload.deleteCount > 0
          ? conversation.messages.slice(0, payload.deleteCount * -1 || undefined)
          : conversation.messages;

      const updatedMessages = currentMessages.concat(userMessage, assistantMessage);

      const depth = MindmapSelectors.selectDepth(state$.value);
      const mindmapElements = MindmapSelectors.selectGraphElements(state$.value);
      const visitedNodes = MindmapSelectors.selectVisitedNodes(state$.value);
      const focusNodeId = MindmapSelectors.selectFocusNodeId(state$.value);

      const isRetry = payload.customFields?.configuration.force_answer_generation;

      const playbackActions: PlaybackAction[] = [];

      if (!isRetry) {
        playbackActions.push({
          type: PlaybackActionType.FillInput,
          mindmap: {
            elements: cleanGraphElementsForPlayback(mindmapElements),
            focusNodeId,
            visitedNodes,
            depth,
          },
          chat: {
            userMessage: payload.message.content,
          },
        });
      } else {
        playbackActions.push({
          type: PlaybackActionType.AIGenerateMessage,
          mindmap: {
            elements: cleanGraphElementsForPlayback(mindmapElements),
            focusNodeId,
            visitedNodes,
            depth,
          },
          chat: {
            previousMessage: conversation.messages.at(-1),
          },
        });
      }

      const customViewState: ViewState = {
        ...conversation.customViewState,
        playbackActions: [...(conversation.customViewState.playbackActions ?? []), ...playbackActions],
      };

      const updatedConversation: Conversation = {
        ...conversation,
        lastActivityDate: Date.now(),
        messages: updatedMessages,
        isMessageStreaming: true,
        customViewState,
      };

      return {
        updatedConversation,
        assistantMessage,
        customFields: payload.customFields,
        captchaToken: payload.captchaToken,
      };
    }),
    switchMap(({ updatedConversation, assistantMessage, customFields, captchaToken }) => {
      return concat(
        of(
          ConversationActions.updateConversation({
            values: updatedConversation,
          }),
        ),
        of(
          ConversationActions.streamMessage({
            conversation: updatedConversation,
            message: assistantMessage,
            customFields,
            captchaToken,
          }),
        ),
      );
    }),
  );
