import { createSelector } from '@reduxjs/toolkit';

import { ChatRootState } from '..';
import { PlaybackState } from './playback.types';

const rootSelector = (state: ChatRootState): PlaybackState => state.playback;

const selectIsPlayback = createSelector([rootSelector], state => state.isPlayback);

const selectPlaybackInputText = createSelector([rootSelector], state => state.playbackInputText);

const selectPlaybackConversation = createSelector([rootSelector], state => state.playbackConversation);

const selectIsTypingPlaybackMessage = createSelector([rootSelector], state => state.isTypingPlaybackMessage);

const selectStepNumber = createSelector([rootSelector], state => state.stepNumber);

const selectIsBotStreaming = createSelector([rootSelector], state => state.isBotStreaming);

const selectIsPlaybackUnavailable = createSelector([rootSelector], state => state.isPlaybackUnavailable);

export const PlaybackSelectors = {
  selectIsPlayback,
  selectPlaybackInputText,
  selectPlaybackConversation,
  selectIsTypingPlaybackMessage,
  selectStepNumber,
  selectIsBotStreaming,
  selectIsPlaybackUnavailable,
};
