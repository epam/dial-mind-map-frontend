import { Conversation } from '@/types/chat';

import { ChatRootState } from '../..';
import { PlaybackInitialState } from '../playback.reducer';
import { PlaybackSelectors } from '../playback.selectors';

describe('PlaybackSelectors', () => {
  const baseState: ChatRootState = {
    playback: { ...PlaybackInitialState },
  } as unknown as ChatRootState;

  it('selectIsPlayback should return isPlayback flag', () => {
    const state: ChatRootState = {
      ...baseState,
      playback: { ...baseState.playback, isPlayback: true },
    };
    const result = PlaybackSelectors.selectIsPlayback(state);
    expect(result).toBe(true);
  });

  it('selectPlaybackInputText should return playbackInputText', () => {
    const state: ChatRootState = {
      ...baseState,
      playback: { ...baseState.playback, playbackInputText: 'hello' },
    };
    const result = PlaybackSelectors.selectPlaybackInputText(state);
    expect(result).toBe('hello');
  });

  it('selectPlaybackConversation should return playbackConversation', () => {
    const conversation: Conversation = { id: 'conv1', messages: [] } as any;
    const state: ChatRootState = {
      ...baseState,
      playback: { ...baseState.playback, playbackConversation: conversation },
    };
    const result = PlaybackSelectors.selectPlaybackConversation(state);
    expect(result).toEqual(conversation);
  });

  it('selectIsTypingPlaybackMessage should return isTypingPlaybackMessage flag', () => {
    const state: ChatRootState = {
      ...baseState,
      playback: { ...baseState.playback, isTypingPlaybackMessage: true },
    };
    const result = PlaybackSelectors.selectIsTypingPlaybackMessage(state);
    expect(result).toBe(true);
  });

  it('selectStepNumber should return current stepNumber', () => {
    const state: ChatRootState = {
      ...baseState,
      playback: { ...baseState.playback, stepNumber: 3 },
    };
    const result = PlaybackSelectors.selectStepNumber(state);
    expect(result).toBe(3);
  });

  it('selectIsBotStreaming should return isBotStreaming flag', () => {
    const state: ChatRootState = {
      ...baseState,
      playback: { ...baseState.playback, isBotStreaming: true },
    };
    const result = PlaybackSelectors.selectIsBotStreaming(state);
    expect(result).toBe(true);
  });

  it('selectIsPlaybackUnavailable should return isPlaybackUnavailable flag', () => {
    const state: ChatRootState = {
      ...baseState,
      playback: { ...baseState.playback, isPlaybackUnavailable: true },
    };
    const result = PlaybackSelectors.selectIsPlaybackUnavailable(state);
    expect(result).toBe(true);
  });
});
