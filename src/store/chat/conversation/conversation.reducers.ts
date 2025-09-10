/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Conversation, ConversationInfo, CustomFields, Message } from '@/types/chat';

import * as ConversationSelectors from './conversation.selectors';
import { ConversationState } from './conversation.types';
export { ConversationSelectors };

export const ConversationInitialState: ConversationState = {
  conversation: {
    id: '',
    folderId: '',
    messages: [],
    name: '',
    model: {
      id: '',
    },
    prompt: '',
    temperature: 0,
    selectedAddons: [],
    customViewState: {
      focusNodeId: '',
      visitedNodeIds: {},
      customElements: {
        edges: [],
        nodes: [],
      },
    },
  },
  conversations: [],
  conversationSignal: new AbortController(),
  isMessageSending: false,
};

export const conversationSlice = createSlice({
  name: 'conversation',
  initialState: ConversationInitialState,
  reducers: {
    init: (state, action: PayloadAction<{ conversationId: string; applicationId: string }>) => state,
    initConversation: (state, { payload }: PayloadAction<Conversation>) => {
      state.conversation = payload;
      if (!state.conversation.customViewState) {
        state.conversation.customViewState = ConversationInitialState.conversation.customViewState;
      }
    },
    getConversations: state => state,
    getConversationsSuccess: (state, { payload }: PayloadAction<{ conversations: ConversationInfo[] }>) => {
      state.conversations = payload.conversations;
    },
    resetConversation: state => {
      state.isMessageSending = false;
    },
    createConversation: (state, { payload }: PayloadAction<Conversation>) => state,
    saveConversation: (
      state,
      { payload }: PayloadAction<{ conversation: Conversation; needToUpdateInBucket?: boolean }>,
    ) => state,
    saveConversationSuccess: (state, { payload }: PayloadAction<{ conversation: Conversation }>) => state,
    updateConversation: (
      state,
      action: PayloadAction<{
        values: Partial<Conversation>;
        isInitialization?: boolean | null;
        needToUpdateInBucket?: boolean;
      }>,
    ) => state,
    updateConversationSuccess: (state, { payload }: PayloadAction<{ conversation: Partial<Conversation> }>) => {
      state.conversation = {
        ...state.conversation,
        lastActivityDate: Date.now(),
        ...payload.conversation,
      };
    },
    updateConversationFail: (state, action: PayloadAction<{ error: string }>) => {
      console.error('Conversation update failed:', action.payload.error);
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        messageIndex: number;
        values: Partial<Message>;
        isInitialization?: boolean;
      }>,
    ) => state,
    updateResponseOfMessage: (
      state,
      action: PayloadAction<{
        messageId: string;
        values: Partial<Message>;
      }>,
    ) => state,
    deleteMessage: (state, action: PayloadAction<{ index: number }>) => state,
    addOrUpdateMessages: (
      state,
      action: PayloadAction<{
        messages: Message[];
        isInitialization?: boolean | null;
        needToUpdateInBucket?: boolean;
      }>,
    ) => state,
    sendMessages: (
      state,
      action: PayloadAction<{
        message: Message;
        deleteCount?: number;
        customFields?: CustomFields;
        captchaToken?: string;
      }>,
    ) => state,
    sendMessage: (
      state,
      action: PayloadAction<{
        message: Message;
        deleteCount?: number;
        customFields?: CustomFields;
        captchaToken?: string;
      }>,
    ) => state,
    streamMessage: (
      state,
      action: PayloadAction<{
        conversation: Conversation;
        message: Message;
        customFields?: CustomFields;
        captchaToken?: string;
      }>,
    ) => state,
    createAbortController: state => {
      state.conversationSignal = new AbortController();
    },
    streamMessageFail: (
      state,
      action: PayloadAction<{
        conversation: Conversation;
        message: string;
        response?: Response;
      }>,
    ) => state,
    streamMessageSuccess: state => state,
    setMessageSending: (state, action: PayloadAction<{ isMessageSending: boolean }>) => {
      state.isMessageSending = action.payload.isMessageSending;
    },
  },
});

export const ConversationActions = conversationSlice.actions;
