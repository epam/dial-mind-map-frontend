import { EMPTY, filter, of, switchMap } from 'rxjs';

import { ChatRootEpic } from '@/types/store';

import { ConversationActions, ConversationSelectors } from '../conversation.reducers';

export const updateResponseOfMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.updateResponseOfMessage.match),
    switchMap(action => {
      const { payload } = action;
      const conversation = ConversationSelectors.selectConversation(state$.value);

      const { values, messageId } = payload;
      const userMessageIndex = conversation.messages.findIndex(m => m.id === messageId);
      const responseMessageIndex = userMessageIndex + 1;

      if (conversation.messages.length >= responseMessageIndex) {
        return of(
          ConversationActions.updateMessage({
            values: values,
            messageIndex: responseMessageIndex,
          }),
        );
      }
      return EMPTY;
    }),
  );
