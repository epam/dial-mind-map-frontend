import { UnknownAction } from '@reduxjs/toolkit';
import { TestScheduler } from 'rxjs/testing';

import { MindmapActions, MindmapInitialState } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatRootEpic } from '@/types/store';

import { PlaybackActions } from '../../playback.reducer';
import { initEpic } from '../init.epic';

describe('initEpic', () => {
  let testScheduler: TestScheduler;
  const epic: ChatRootEpic = initEpic;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('dispatches setIsPlaybackUnavailable when no customViewState.playbackActions', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const payload = { playback: { customViewState: { playbackActions: [] }, messagesStack: [] } } as any;
      const action$ = hot('-a-', { a: PlaybackActions.init(payload) });
      const output$ = epic(action$, {} as any);

      const expectedMarble = '-a-';
      const expectedValues: { [key: string]: UnknownAction } = {
        a: PlaybackActions.setIsPlaybackUnavailable(true),
      };

      expectObservable(output$).toBe(expectedMarble, expectedValues);
    });
  });

  it('initializes playback and mindmap when playbackActions present', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const elements = [{ id: '1', data: { label: 'Element 1', id: '1' } }];
      const visitedNodes = { '1': '2' };
      const focusNodeId = '1';
      const depth = 2 as const;
      const customState = {
        playbackActions: [{ mindmap: { elements: elements, visitedNodes, focusNodeId, depth } }],
      };
      const messages = ['m1', 'm2', 'm3'];
      const payload = { playback: { customViewState: customState, messagesStack: messages } } as any;

      const action$ = hot('-a-', { a: PlaybackActions.init(payload) });
      const output$ = epic(action$, {} as any);

      const expectedMarble = '-(ab)-';
      const expectedValues: { [key: string]: UnknownAction } = {
        a: PlaybackActions.setPlaybackConversation({ ...payload, messages: messages.slice(0, 2) }),
        b: MindmapActions.init({
          ...MindmapInitialState,
          elements,
          isReady: true,
          focusNodeId,
          visitedNodes,
          isNotFound: false,
          isRootNodeNotFound: false,
          depth,
        }),
      };

      expectObservable(output$).toBe(expectedMarble, expectedValues);
    });
  });
});
