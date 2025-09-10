import { ofType } from 'redux-observable';
import { concat, concatMap, EMPTY, filter, of, switchMap, take } from 'rxjs';

import { ChatRootEpic } from '@/types/store';

import { ConversationActions, ConversationSelectors } from '../../conversation/conversation.reducers';
import { MindmapActions } from '../../mindmap/mindmap.reducers';
import { ChatUIActions } from '../ui.reducers';

export const resetEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ChatUIActions.reset.match),
    switchMap(() => {
      const conversation = ConversationSelectors.selectConversation(state$.value);
      if (conversation.messages.length <= 2) {
        return EMPTY;
      }

      return concat(
        of(ConversationActions.resetConversation()),
        action$.pipe(
          ofType(ConversationActions.updateConversationSuccess.type),
          take(1),
          concatMap(() => of(MindmapActions.reset())),
        ),
      );
    }),
  );
