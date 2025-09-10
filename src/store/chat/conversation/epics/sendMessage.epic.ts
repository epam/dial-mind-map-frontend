import { concat, filter, map, of, switchMap } from 'rxjs';

import { Conversation, Message, Role } from '@/types/chat';
import { EntityType } from '@/types/common';
import { ChatRootEpic } from '@/types/store';
import { getFocusNodeResponseId } from '@/utils/app/conversation';

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
        id: getFocusNodeResponseId(payload.message.id!),
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

      const updatedConversation: Conversation = {
        ...conversation,
        lastActivityDate: Date.now(),
        messages: updatedMessages,
        isMessageStreaming: true,
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
