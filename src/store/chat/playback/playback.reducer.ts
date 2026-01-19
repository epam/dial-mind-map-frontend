/* eslint-disable @typescript-eslint/no-unused-vars */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Conversation, Message, PlaybackAction } from '@/types/chat';
import { Element, GraphElement } from '@/types/graph';

import { PlaybackState } from './playback.types';

export { PlaybackSelectors } from './playback.selectors';

export const PlaybackInitialState: PlaybackState = {
  isPlayback: false,
  playbackInputText: null,
  playbackConversation: null,
  isTypingPlaybackMessage: false,
  stepNumber: 0,
  isBotStreaming: false,
  streamedBotMessage: '',
  isPlaybackUnavailable: false,
};

export const playbackSlice = createSlice({
  name: 'playback',
  initialState: PlaybackInitialState,
  reducers: {
    init: (state, { payload }: { payload: Conversation }) => state,
    setIsPlayback: (state, { payload }: { payload: boolean }) => {
      state.isPlayback = payload;
    },
    resetPlayback: state => {
      state.isPlayback = false;
    },
    setPlaybackInputText: (state, { payload }: { payload: string | null }) => {
      state.playbackInputText = payload;
    },
    resetPlaybackInputText: state => {
      state.playbackInputText = null;
    },
    setPlaybackConversation: (state, { payload }: { payload: Conversation }) => {
      state.playbackConversation = payload;
    },
    playbackNextStep: (state, { payload }: { payload: { afterAiGenerate?: boolean } }) => state,
    playbackPreviousStep: state => state,
    updateConversation: (
      state,
      {
        payload,
      }: {
        payload: {
          action: PlaybackAction;
          message?: Message;
          afterAiGenerate?: boolean;
          previousFocusNodeId?: string;
          previousGraphElements?: Element<GraphElement>[];
        };
      },
    ) => state,
    setIsTypingPlaybackMessage: (state, { payload }: { payload: boolean }) => {
      state.isTypingPlaybackMessage = payload;
    },
    setStepNumber: (state, { payload }: { payload: number }) => {
      state.stepNumber = payload;
    },
    changeFocusNode: (state, { payload }: { payload: { action: PlaybackAction } }) => state,
    revertConversation: state => state,
    setBotStreaming: (state, { payload }: PayloadAction<{ isStreaming: boolean }>) => {
      state.isBotStreaming = payload.isStreaming;
    },
    streamBotMessage: (state, { payload }: { payload: { message: Message } }) => {
      state.streamedBotMessage = '';
    },
    streamBotMessageChunk: (state, { payload }: PayloadAction<{ chunk: string }>) => {
      state.streamedBotMessage += payload.chunk;
      if (state.playbackConversation && state.playbackConversation.messages.length) {
        const lastIndex = state.playbackConversation.messages.length - 1;
        const lastMessage = state.playbackConversation.messages[lastIndex];
        if (lastMessage) {
          state.playbackConversation.messages[lastIndex] = {
            ...lastMessage,
            content: (lastMessage.content || '') + payload.chunk,
            availableNodes: [],
          };
        }
      }
    },
    streamBotMessageSuccess: (state, { payload }: PayloadAction<{ availableNodes: Message['availableNodes'] }>) => {
      state.isBotStreaming = false;
      if (state.playbackConversation && state.playbackConversation.messages.length) {
        const lastIndex = state.playbackConversation.messages.length - 1;
        const lastMessage = state.playbackConversation.messages[lastIndex];
        if (lastMessage) {
          state.playbackConversation.messages[lastIndex] = {
            ...lastMessage,
            availableNodes: payload.availableNodes || [],
          };
        }
      }
    },
    resetStreamedBotMessage: state => {
      state.streamedBotMessage = '';
    },
    setIsPlaybackUnavailable: (state, { payload }: { payload: boolean }) => {
      state.isPlaybackUnavailable = payload;
    },
  },
});

export const PlaybackActions = playbackSlice.actions;
