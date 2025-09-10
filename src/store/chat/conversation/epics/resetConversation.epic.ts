import { filter, of, switchMap } from 'rxjs';

import { ChatRootEpic } from '@/types/store';

import { ConversationActions, ConversationInitialState } from '../conversation.reducers';

export const resetConversationEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ConversationActions.resetConversation.match),
    switchMap(() => {
      return of(
        ConversationActions.updateConversation({
          values: {
            messages: [],
            customViewState: ConversationInitialState.conversation.customViewState,
          },
        }),
      );
    }),
  );
