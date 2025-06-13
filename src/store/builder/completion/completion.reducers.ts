/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { CustomFields } from '@/types/chat';
import { Node } from '@/types/graph';

export interface CompletionState {
  isMessageSending: boolean;
  abortController: AbortController;
  streamingContent: string | null;
}

const initialState: CompletionState = {
  isMessageSending: false,
  abortController: new AbortController(),
  streamingContent: null,
};

export const completionSlice = createSlice({
  name: 'completion',
  initialState,
  reducers: {
    sendCompletionRequest: (
      state,
      action: PayloadAction<{
        userMessage: string;
        nodeId: string;
        customFields?: CustomFields;
        updatedField?: keyof Node;
      }>,
    ) => {
      state.isMessageSending = true;
    },
    streamCompletionSuccess: state => {
      state.isMessageSending = false;
      state.streamingContent = null;
    },
    setSteamingContent: (
      state,
      action: PayloadAction<{
        content: string | null;
      }>,
    ) => {
      state.streamingContent = action.payload.content;
    },
    streamCompletionFail: (
      state,

      action: PayloadAction<{
        nodeId: string;
        message: string;
        response?: Response;
      }>,
    ) => {
      state.isMessageSending = false;
      state.streamingContent = null;
    },
    cancelStreaming: state => {
      state.abortController.abort();
      state.abortController = new AbortController();
      state.streamingContent = null;
    },
  },
});

export const CompletionActions = completionSlice.actions;
export default completionSlice.reducer;
