import { TestScheduler } from 'rxjs/testing';

import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';
import { PlaybackActionType } from '@/types/chat';
import { ChatRootEpic } from '@/types/store';

import { PlaybackActions } from '../../playback.reducer';
import { changeFocusNodeEpic } from '../changeFocusNode.epic';

describe('changeFocusNodeEpic', () => {
  let testScheduler: TestScheduler;
  const epic: ChatRootEpic = changeFocusNodeEpic;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('emits the correct Mindmap and Playback actions when payload is valid', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const elements = [{ id: '1', data: { label: 'Element 1', id: '1' } }];
      const visitedNodes = { '1': '2' };
      const focusNodeId = '1';
      const depth = 2 as const;
      const payload = {
        action: { type: PlaybackActionType.ChangeFocusNode, mindmap: { elements, visitedNodes, focusNodeId, depth } },
      };

      const action$ = hot('-a-', { a: PlaybackActions.changeFocusNode(payload) });
      const output$ = epic(action$, {} as any);

      const expectedMarble = '-(abcde)-';
      const expectedValues = {
        a: MindmapActions.setVisitedNodes(visitedNodes),
        b: MindmapActions.setGraphElements(elements),
        c: MindmapActions.setFocusNodeId(focusNodeId),
        d: PlaybackActions.setPlaybackInputText(null),
        e: MindmapActions.setDepth(depth),
      };

      expectObservable(output$).toBe(expectedMarble, expectedValues);
    });
  });

  it('completes without emitting when payload is missing required properties', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const badPayload = { action: { mindmap: { elements: null, visitedNodes: null, focusNodeId: null, depth: 0 } } };

      const action$ = hot('-a-', { a: PlaybackActions.changeFocusNode(badPayload as any) });
      const output$ = epic(action$, {} as any);

      expectObservable(output$).toBe('---');
    });
  });
});
