import { Subject } from 'rxjs';

jest.mock('@/store/chat/conversation/conversation.reducers', () => {
  const actual = jest.requireActual('@/store/chat/conversation/conversation.reducers');
  return {
    ...actual,
    ConversationSelectors: {
      ...actual.ConversationSelectors,
      selectConversation: jest.fn(),
    },
  };
});

import { ConversationActions, ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';

import { ChatUIActions } from '../../ui.reducers';
import { resetEpic } from '../reset.epic';

describe('resetEpic', () => {
  let action$: Subject<any>;
  let state$: any;
  let outputActions: any[];

  beforeEach(() => {
    action$ = new Subject();
    outputActions = [];
    state$ = { value: {} };
    (ConversationSelectors.selectConversation as unknown as jest.Mock).mockReturnValue({ messages: [] });

    resetEpic(action$, state$).subscribe(a => outputActions.push(a));
  });

  afterEach(() => {
    action$.complete();
    jest.resetAllMocks();
  });

  it('emits nothing when conversation has <=2 messages', () => {
    (ConversationSelectors.selectConversation as unknown as jest.Mock).mockReturnValue({ messages: ['a', 'b'] });
    action$.next(ChatUIActions.reset());
    expect(outputActions).toEqual([]);
  });

  it('emits resetConversation and then MindmapActions.reset when messages >2', () => {
    (ConversationSelectors.selectConversation as unknown as jest.Mock).mockReturnValue({
      messages: ['m1', 'm2', 'm3'],
    });

    action$.next(ChatUIActions.reset());
    expect(outputActions).toEqual([ConversationActions.resetConversation()]);

    action$.next(ConversationActions.updateConversationSuccess({ conversation: {} }));
    expect(outputActions).toEqual([ConversationActions.resetConversation(), MindmapActions.reset()]);
  });
});
