import { TestScheduler } from 'rxjs/testing';

import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';
import { PlaybackActionType } from '@/types/chat';

import { PlaybackActions } from '../../playback.reducer';
import { PlaybackSelectors } from '../../playback.selectors';
import { playbackNextStepEpic } from '../playbackNextStep.epic';

jest.mock('@/store/chat/conversation/conversation.reducers');
jest.mock('../../playback.selectors');

const conversationSelectors = ConversationSelectors as jest.Mocked<typeof ConversationSelectors>;
const playbackSelectors = PlaybackSelectors as jest.Mocked<typeof PlaybackSelectors>;

describe('playbackNextStepEpic', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    jest.resetAllMocks();
  });

  it('completes without emitting when no next action', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      // Setup selectors
      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(0);

      const action$ = hot('-a-', { a: PlaybackActions.playbackNextStep() });
      const state$ = { value: {} } as any;

      const output$ = playbackNextStepEpic(action$, state$);
      expectObservable(output$).toBe('---');
    });
  });

  it('emits setStepNumber and setPlaybackInputText for FillInput', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const messages = [{ id: 'n1', content: 'hello' }];
      const nextAction = { type: PlaybackActionType.FillInput, mindmap: { focusNodeId: 'n1' } } as any;

      conversationSelectors.selectConversation.mockReturnValue({ playback: { messagesStack: messages } } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([{}, nextAction] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(0);

      const action$ = hot('-a-', { a: PlaybackActions.playbackNextStep() });
      const state$ = { value: {} } as any;

      const output$ = playbackNextStepEpic(action$, state$);
      const expected = '-(ab)-';
      const expectedValues = {
        a: PlaybackActions.setStepNumber(1),
        b: PlaybackActions.setPlaybackInputText('hello'),
      };

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  it('emits setStepNumber and setPlaybackInputText(empty) for FillInput when message not found', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const messages = [{ id: 'other', content: 'world' }];
      const nextAction = { type: PlaybackActionType.FillInput, mindmap: { focusNodeId: 'n1' } } as any;

      conversationSelectors.selectConversation.mockReturnValue({ messages } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([{}, nextAction] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(0);

      const action$ = hot('-a-', { a: PlaybackActions.playbackNextStep() });
      const state$ = { value: {} } as any;

      const output$ = playbackNextStepEpic(action$, state$);
      const expected = '-(ab)-';
      const expectedValues = {
        a: PlaybackActions.setStepNumber(1),
        b: PlaybackActions.setPlaybackInputText(''),
      };

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  it('emits setStepNumber and updateConversation for UpdateConversation', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const nextAction = { type: PlaybackActionType.UpdateConversation, mindmap: {} } as any;

      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([{}, nextAction] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(0);

      const action$ = hot('-a-', { a: PlaybackActions.playbackNextStep() });
      const state$ = { value: {} } as any;

      const output$ = playbackNextStepEpic(action$, state$);
      const expected = '-(ab)-';
      const expectedValues = {
        a: PlaybackActions.setStepNumber(1),
        b: PlaybackActions.updateConversation({ action: nextAction }),
      };

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  it('emits correct actions for ChangeFocusNode', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const nextAction = { type: PlaybackActionType.ChangeFocusNode, mindmap: {} } as any;

      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([{}, nextAction] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(0);

      const action$ = hot('-a-', { a: PlaybackActions.playbackNextStep() });
      const state$ = { value: {} } as any;

      const output$ = playbackNextStepEpic(action$, state$);
      const expected = '-(ab)-';
      const expectedValues = {
        a: PlaybackActions.setStepNumber(1),
        b: PlaybackActions.changeFocusNode({ action: nextAction }),
      };

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  it('emits setStepNumber and depth/actions for ChangeDepth', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const mindmap = {
        depth: 2 as const,
        visitedNodes: { '1': '2' },
        elements: [{ id: '1', data: { label: 'Element 1', id: '1' } }],
        focusNodeId: '1',
      };
      const nextAction = { type: PlaybackActionType.ChangeDepth, mindmap } as any;

      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([{}, nextAction] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(0);

      const action$ = hot('-a-', { a: PlaybackActions.playbackNextStep() });
      const state$ = { value: {} } as any;

      const output$ = playbackNextStepEpic(action$, state$);
      const expected = '-(abcde)-';
      const expectedValues = {
        a: PlaybackActions.setStepNumber(1),
        b: MindmapActions.setDepth(2),
        c: MindmapActions.setVisitedNodes(mindmap.visitedNodes),
        d: MindmapActions.setGraphElements(mindmap.elements),
        e: MindmapActions.setFocusNodeId(mindmap.focusNodeId),
      };

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });
});
