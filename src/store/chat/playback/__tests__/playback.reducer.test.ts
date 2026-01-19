import { Conversation, Message } from '@/types/chat';

import { PlaybackActions, PlaybackInitialState, playbackSlice } from '../playback.reducer';
import { PlaybackState } from '../playback.types';

describe('playbackSlice reducer', () => {
  let initialState: PlaybackState;

  beforeEach(() => {
    initialState = { ...PlaybackInitialState };
  });

  it('should return the initial state when passed an unknown action', () => {
    const nextState = playbackSlice.reducer(initialState, { type: 'unknown' });
    expect(nextState).toEqual(initialState);
  });

  it('should handle setIsPlayback', () => {
    const action = PlaybackActions.setIsPlayback(true);
    const nextState = playbackSlice.reducer(initialState, action);
    expect(nextState.isPlayback).toBe(true);
  });

  it('should handle resetPlayback', () => {
    const state: PlaybackState = { ...initialState, isPlayback: true };
    const nextState = playbackSlice.reducer(state, PlaybackActions.resetPlayback());
    expect(nextState.isPlayback).toBe(false);
  });

  it('should handle setPlaybackInputText and resetPlaybackInputText', () => {
    const setAction = PlaybackActions.setPlaybackInputText('test');
    const setState = playbackSlice.reducer(initialState, setAction);
    expect(setState.playbackInputText).toBe('test');

    const resetState = playbackSlice.reducer(setState, PlaybackActions.resetPlaybackInputText());
    expect(resetState.playbackInputText).toBeNull();
  });

  it('should handle setPlaybackConversation', () => {
    const conversation: Conversation = { id: '1', messages: [] } as any;
    const action = PlaybackActions.setPlaybackConversation(conversation);
    const nextState = playbackSlice.reducer(initialState, action);
    expect(nextState.playbackConversation).toEqual(conversation);
  });

  it('should handle setIsTypingPlaybackMessage', () => {
    const action = PlaybackActions.setIsTypingPlaybackMessage(true);
    const nextState = playbackSlice.reducer(initialState, action);
    expect(nextState.isTypingPlaybackMessage).toBe(true);
  });

  it('should handle setStepNumber', () => {
    const action = PlaybackActions.setStepNumber(5);
    const nextState = playbackSlice.reducer(initialState, action);
    expect(nextState.stepNumber).toBe(5);
  });

  it('should handle setBotStreaming', () => {
    const action = PlaybackActions.setBotStreaming({ isStreaming: true });
    const nextState = playbackSlice.reducer(initialState, action);
    expect(nextState.isBotStreaming).toBe(true);
  });

  it('should handle resetStreamedBotMessage', () => {
    const state: PlaybackState = { ...initialState, streamedBotMessage: 'data' };
    const nextState = playbackSlice.reducer(state, PlaybackActions.resetStreamedBotMessage());
    expect(nextState.streamedBotMessage).toBe('');
  });

  describe('streamBotMessageChunk', () => {
    it('should append chunk and update last message content', () => {
      const message: Message = { id: 'm1', role: 'bot', content: 'Hello', availableNodes: ['a'] } as any;
      const conversation: Conversation = { id: 'c1', messages: [message] } as Conversation;
      const state: PlaybackState = { ...initialState, playbackConversation: conversation };

      const action = PlaybackActions.streamBotMessageChunk({ chunk: ' world' });
      const nextState = playbackSlice.reducer(state, action);

      expect(nextState.streamedBotMessage).toBe(' world');

      const lastMsg = nextState.playbackConversation?.messages.slice(-1)[0];
      expect(lastMsg?.content).toBe('Hello world');
      expect(lastMsg?.availableNodes).toEqual([]);
    });
  });

  describe('streamBotMessageSuccess', () => {
    it('should stop streaming and set availableNodes of last message', () => {
      const message: Message = { id: 'm1', role: 'bot', content: 'Hi', availableNodes: [] } as any;
      const conversation: Conversation = { id: 'c1', messages: [message] } as Conversation;
      const state: PlaybackState = { ...initialState, isBotStreaming: true, playbackConversation: conversation };

      const action = PlaybackActions.streamBotMessageSuccess({
        availableNodes: [{ label: 'node1' }, { label: 'node2' }] as any,
      });
      const nextState = playbackSlice.reducer(state, action);

      expect(nextState.isBotStreaming).toBe(false);
      const lastMsg = nextState.playbackConversation?.messages.slice(-1)[0];
      expect(lastMsg?.availableNodes).toEqual([{ label: 'node1' }, { label: 'node2' }] as any);
    });
  });

  it('should handle setIsPlaybackUnavailable', () => {
    const action = PlaybackActions.setIsPlaybackUnavailable(true);
    const nextState = playbackSlice.reducer(initialState, action);
    expect(nextState.isPlaybackUnavailable).toBe(true);
  });

  it('should handle init without changing state', () => {
    const conversation: Conversation = { id: '1', messages: [] } as any;
    const nextState = playbackSlice.reducer(initialState, PlaybackActions.init(conversation));
    expect(nextState).toEqual(initialState);
  });

  it('should handle playbackNextStep and playbackPreviousStep without changing state', () => {
    const nextState = playbackSlice.reducer(initialState, PlaybackActions.playbackNextStep({}));
    expect(nextState).toEqual(initialState);
    const prevState = playbackSlice.reducer(initialState, PlaybackActions.playbackPreviousStep());
    expect(prevState).toEqual(initialState);
  });

  it('should handle updateConversation, changeFocusNode, and revertConversation without changing state', () => {
    const action1 = PlaybackActions.updateConversation({ action: {} as any });
    const state1 = playbackSlice.reducer(initialState, action1);
    expect(state1).toEqual(initialState);

    const action2 = PlaybackActions.changeFocusNode({ action: {} as any });
    const state2 = playbackSlice.reducer(initialState, action2);
    expect(state2).toEqual(initialState);

    const state3 = playbackSlice.reducer(initialState, PlaybackActions.revertConversation());
    expect(state3).toEqual(initialState);
  });
});
