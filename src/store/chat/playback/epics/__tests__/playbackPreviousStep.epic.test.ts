import { TestScheduler } from 'rxjs/testing';

import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';
import { PlaybackActionType } from '@/types/chat';

import { PlaybackActions } from '../../playback.reducer';
import { PlaybackSelectors } from '../../playback.selectors';
import { playbackPreviousStepEpic } from '../playbackPreviousStep.epic';

jest.mock('@/store/chat/conversation/conversation.reducers');
jest.mock('../../playback.selectors');

const conversationSelectors = ConversationSelectors as jest.Mocked<typeof ConversationSelectors>;
const playbackSelectors = PlaybackSelectors as jest.Mocked<typeof PlaybackSelectors>;

describe('playbackPreviousStepEpic', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    jest.resetAllMocks();
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('uses visitedNodes mapping as focusNodeId when actionBeforePrevious is Init for UpdateConversation', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const visitedNodes = { oldFocus: 'mappedFocus' };
      const prevAction = { mindmap: { focusNodeId: 'oldFocus', visitedNodes, elements: [], depth: 1 } } as any;
      const initAction = { type: PlaybackActionType.Init, mindmap: {} } as any;
      const last = { type: PlaybackActionType.UpdateConversation, mindmap: {} } as any;
      conversationSelectors.selectConversation.mockReturnValue({
        playback: { messagesStack: [{ id: 'oldFocus', content: 'textOld' }] },
      } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([initAction, prevAction, last] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(2);

      const action$ = hot('-a-', { a: PlaybackActions.playbackPreviousStep() });
      const output$ = playbackPreviousStepEpic(action$, { value: {} } as any);

      expectObservable(output$).toBe('-(abcdefg)-', {
        a: PlaybackActions.setStepNumber(1),
        b: PlaybackActions.revertConversation(),
        c: PlaybackActions.setPlaybackInputText(''),
        d: MindmapActions.setVisitedNodes(visitedNodes),
        e: MindmapActions.setGraphElements(prevAction.mindmap.elements),
        f: MindmapActions.setFocusNodeId('mappedFocus'),
        g: MindmapActions.setDepth(prevAction.mindmap.depth),
      });
    });
  });

  it('does not emit when at first step or no actions', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(0);

      const action$ = hot('-a-', { a: PlaybackActions.playbackPreviousStep() });
      const state$ = { value: {} } as any;

      const output$ = playbackPreviousStepEpic(action$, state$);
      expectObservable(output$).toBe('---');
    });
  });

  it('does not emit when previousAction or lastAction is missing in playbackActions array', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      // setup playbackStepNumber > 0 but playbackActions length < playbackStepNumber + 1
      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      // only one action in array, so lastAction undefined for stepNumber=1
      conversationSelectors.selectPlaybackActions.mockReturnValue([{}] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(1);

      const action$ = hot('-a-', { a: PlaybackActions.playbackPreviousStep() });
      const state$ = { value: {} } as any;
      const output$ = playbackPreviousStepEpic(action$, state$);
      expectObservable(output$).toBe('---');
    });
  });

  it('emits setStepNumber and clear input for FillInput', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const previousAction = { mindmap: {} } as any;
      const last = { type: PlaybackActionType.FillInput, mindmap: {} } as any;
      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([previousAction, last] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(1);

      const action$ = hot('-a-', { a: PlaybackActions.playbackPreviousStep() });
      const output$ = playbackPreviousStepEpic(action$, { value: {} } as any);

      const expected = '-(ab)-';
      const values = {
        a: PlaybackActions.setStepNumber(0),
        b: PlaybackActions.setPlaybackInputText(null),
      };
      expectObservable(output$).toBe(expected, values);
    });
  });

  it('emits correct sequence for UpdateConversation', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const prevAction = {
        mindmap: { focusNodeId: 'p1', visitedNodes: { v: true }, elements: [{ id: 'e1', data: {} }], depth: 5 },
      } as any;
      const last = { type: PlaybackActionType.UpdateConversation, mindmap: {} } as any;
      const messages = [{ id: 'p1', content: 'previousAction' }];
      conversationSelectors.selectConversation.mockReturnValue({ playback: { messagesStack: messages } } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([prevAction, last] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(1);

      const action$ = hot('-a-', { a: PlaybackActions.playbackPreviousStep() });
      const output$ = playbackPreviousStepEpic(action$, { value: {} } as any);

      expectObservable(output$).toBe('-(abcdefg)-', {
        a: PlaybackActions.setStepNumber(0),
        b: PlaybackActions.revertConversation(),
        c: PlaybackActions.setPlaybackInputText(''),
        d: MindmapActions.setVisitedNodes(prevAction.mindmap.visitedNodes),
        e: MindmapActions.setGraphElements(prevAction.mindmap.elements),
        f: MindmapActions.setFocusNodeId(prevAction.mindmap.focusNodeId),
        g: MindmapActions.setDepth(prevAction.mindmap.depth),
      });
    });
  });

  it('emits correct sequence when last action is ChangeFocusNode', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const mindmap = {
        depth: 2 as const,
        visitedNodes: { '1': '2' },
        elements: [{ id: '1', data: { label: 'Element 1', id: '1' } }],
        focusNodeId: '1',
      };
      const previousAction = {
        mindmap: mindmap,
      };
      const lastFocus = { type: PlaybackActionType.ChangeFocusNode, mindmap: {} } as any;
      conversationSelectors.selectConversation.mockReturnValue({ messages: [{ id: 'p2', content: '' }] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([previousAction, lastFocus] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(1);

      const action$ = hot('-a-', { a: PlaybackActions.playbackPreviousStep() });
      const output$ = playbackPreviousStepEpic(action$, { value: {} } as any);

      expectObservable(output$).toBe('-(acdef)-', {
        a: PlaybackActions.setStepNumber(0),
        c: MindmapActions.setVisitedNodes(previousAction.mindmap.visitedNodes),
        d: MindmapActions.setGraphElements(previousAction.mindmap.elements),
        e: MindmapActions.setFocusNodeId(previousAction.mindmap.focusNodeId),
        f: MindmapActions.setDepth(previousAction.mindmap.depth),
      });
    });
  });

  it('emits correct sequence when last action is ChangeDepth', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const mindmap = {
        depth: 2 as const,
        visitedNodes: { '1': '2' },
        elements: [{ id: '1', data: { label: 'Element 1', id: '1' } }],
        focusNodeId: '1',
      };
      const previousAction = {
        mindmap: mindmap,
      };
      const lastDepth = { type: PlaybackActionType.ChangeDepth, mindmap: previousAction.mindmap } as any;
      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([previousAction, lastDepth] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(1);

      const action$ = hot('-a-', { a: PlaybackActions.playbackPreviousStep() });
      const output$ = playbackPreviousStepEpic(action$, { value: {} } as any);

      expectObservable(output$).toBe('-(abcdef)-', {
        a: PlaybackActions.setStepNumber(0),
        b: MindmapActions.setDepth(previousAction.mindmap.depth),
        c: MindmapActions.setVisitedNodes(previousAction.mindmap.visitedNodes),
        d: MindmapActions.setGraphElements(previousAction.mindmap.elements),
        e: MindmapActions.setFocusNodeId(previousAction.mindmap.focusNodeId),
        f: PlaybackActions.setPlaybackInputText(''),
      });
    });
  });

  it('does not emit when last action type is unknown', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const previousAction = { mindmap: {} } as any;
      const lastUnknown = { type: 'UNKNOWN_ACTION', mindmap: {} } as any;
      conversationSelectors.selectConversation.mockReturnValue({ messages: [] } as any);
      conversationSelectors.selectPlaybackActions.mockReturnValue([previousAction, lastUnknown] as any);
      playbackSelectors.selectStepNumber.mockReturnValue(1);

      const action$ = hot('-a-', { a: PlaybackActions.playbackPreviousStep() });
      const output$ = playbackPreviousStepEpic(action$, { value: {} } as any);
      expectObservable(output$).toBe('---');
    });
  });
});
