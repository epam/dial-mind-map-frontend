import { concat, filter, of, switchMap } from 'rxjs';

import { ChatRootEpic } from '@/types/store';

import { ConversationActions } from '../conversation.reducers';

export const sendMessagesEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ConversationActions.sendMessages.match),
    switchMap(({ payload }) => {
      return concat(
        of(ConversationActions.createAbortController()),
        of(
          ConversationActions.sendMessage({
            message: payload.message,
            deleteCount: payload.deleteCount,
            customFields: payload.customFields,
            captchaToken: payload.captchaToken,
          }),
        ),
      );
    }),
  );
