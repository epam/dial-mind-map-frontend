import { of, throwError } from 'rxjs';

import { ConversationService } from '@/utils/app/data/conversation-service';

import { BucketSelectors } from '../../../bucket/bucket.reducer';
import { ChatUISelectors } from '../../../ui/ui.reducers';
import { ConversationActions } from '../../conversation.reducers';
import { getConversationsEpic } from '../getConversations.epic';

jest.mock('@/utils/app/data/conversation-service');
jest.mock('../../../ui/ui.reducers');
jest.mock('../../../bucket/bucket.reducer');

const mockGetConversations = ConversationService.getConversations as jest.MockedFunction<
  typeof ConversationService.getConversations
>;
const mockSelectApi = ChatUISelectors.selectIsAllowApiKey as jest.MockedFunction<
  typeof ChatUISelectors.selectIsAllowApiKey
>;
const mockSelectBucket = BucketSelectors.selectBucketId as jest.MockedFunction<typeof BucketSelectors.selectBucketId>;

describe('getConversationsEpic', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('emits nothing and logs error when bucketId is missing', done => {
    // setup selectors
    mockSelectApi.mockReturnValue(false);
    mockSelectBucket.mockReturnValue('');
    // spy console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const action$ = of(ConversationActions.getConversations());
    const state$ = of({}) as any;

    const output$ = getConversationsEpic(action$, state$);
    const actions: any[] = [];
    output$.subscribe({
      next: a => actions.push(a),
      complete: () => {
        expect(consoleSpy).toHaveBeenCalledWith('Bucket ID is missing');
        expect(actions).toEqual([]);
        consoleSpy.mockRestore();
        done();
      },
    });
  });

  it('emits success with empty array when API key allowed', done => {
    mockSelectApi.mockReturnValue(true);
    mockSelectBucket.mockReturnValue('bucket1');

    const action$ = of(ConversationActions.getConversations());
    const state$ = of({}) as any;

    const output$ = getConversationsEpic(action$, state$);
    const actions: any[] = [];
    output$.subscribe({
      next: a => actions.push(a),
      complete: () => {
        expect(actions).toEqual([ConversationActions.getConversationsSuccess({ conversations: [] })]);
        done();
      },
    });
  });

  it('fetches conversations and emits success when API key not allowed', done => {
    mockSelectApi.mockReturnValue(false);
    mockSelectBucket.mockReturnValue('bucket2');
    const conversations = [{ id: 'c1', text: 'hello' }] as any;
    mockGetConversations.mockReturnValue(of(conversations));

    const action$ = of(ConversationActions.getConversations());
    const state$ = of({}) as any;

    const output$ = getConversationsEpic(action$, state$);
    const actions: any[] = [];
    output$.subscribe({
      next: a => actions.push(a),
      complete: () => {
        expect(mockGetConversations).toHaveBeenCalledWith('conversations/bucket2', true);
        expect(actions).toEqual([ConversationActions.getConversationsSuccess({ conversations: conversations })]);
        done();
      },
    });
  });

  it('logs error and emits nothing on service failure', done => {
    mockSelectApi.mockReturnValue(false);
    mockSelectBucket.mockReturnValue('bucket3');
    mockGetConversations.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const action$ = of(ConversationActions.getConversations());
    const state$ = of({}) as any;

    const output$ = getConversationsEpic(action$, state$);
    const actions: any[] = [];
    output$.subscribe({
      next: a => actions.push(a),
      complete: () => {
        expect(consoleSpy).toHaveBeenCalledWith('Conversations fetching failed');
        expect(actions).toEqual([]);
        consoleSpy.mockRestore();
        done();
      },
    });
  });
});
