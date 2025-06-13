import { createSelector } from '@reduxjs/toolkit';

import { BuilderRootState } from '..';
import { CompletionState } from './completion.reducers';

const rootSelector = (state: BuilderRootState): CompletionState => state.completion;

const selectIsMessageStreaming = createSelector([rootSelector], state => state.isMessageSending);
const selectConversationSignal = createSelector([rootSelector], state => state.abortController);
const selectStreamingContent = createSelector([rootSelector], state => state.streamingContent);

export const CompletionSelectors = {
  selectIsMessageStreaming,
  selectConversationSignal,
  selectStreamingContent,
};
