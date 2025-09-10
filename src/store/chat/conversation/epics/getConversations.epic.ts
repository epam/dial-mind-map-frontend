import { catchError, EMPTY, filter, map, of, switchMap, withLatestFrom } from 'rxjs';

import { ChatRootEpic } from '@/types/store';
import { ConversationService } from '@/utils/app/data/conversation-service';

import { BucketSelectors } from '../../bucket/bucket.reducer';
import { ChatUISelectors } from '../../ui/ui.reducers';
import { ConversationActions } from '../conversation.reducers';

export const getConversationsEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.getConversations.match),
    withLatestFrom(state$.pipe(map(ChatUISelectors.selectIsAllowApiKey))),
    withLatestFrom(state$.pipe(map(BucketSelectors.selectBucketId))),
    switchMap(([[, isAllowApiKey], bucketId]) => {
      if (!bucketId) {
        console.error('Bucket ID is missing');
        return EMPTY;
      }

      if (isAllowApiKey) {
        return of(ConversationActions.getConversationsSuccess({ conversations: [] }));
      }

      return ConversationService.getConversations(`conversations/${bucketId}`, true).pipe(
        switchMap(conversations => of(ConversationActions.getConversationsSuccess({ conversations }))),
        catchError(() => {
          console.error('Conversations fetching failed');
          return EMPTY;
        }),
      );
    }),
  );
