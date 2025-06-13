import { createSelector } from '@reduxjs/toolkit';

import { ChatRootState } from '../index';
import { ConversationState } from './conversation.types';

const rootSelector = (state: ChatRootState): ConversationState => state.conversation;

export const selectConversation = createSelector([rootSelector], state => state.conversation);

export const selectConversationSignal = createSelector([rootSelector], state => {
  return state.conversationSignal;
});

export const selectIsMessagesError = createSelector([selectConversation], conv => {
  return conv.messages.some(message => typeof message.errorMessage !== 'undefined');
});

export const selectIsLastMessageError = createSelector([selectConversation], conv => {
  return !!conv.messages.at(-1)?.errorMessage;
});

export const selectIsMessageStreaming = createSelector([selectConversation], conv => !!conv.isMessageStreaming);

export const selectIsMessageSending = createSelector([rootSelector], state => state.isMessageSending);

export const selectCustomElements = createSelector([selectConversation], conv => conv.customViewState.customElements);

export const selectCustomViewState = createSelector([selectConversation], conv => conv.customViewState);

export const selectConversations = createSelector([rootSelector], state => state.conversations);
