import { toast, ToastOptions } from 'react-hot-toast';
import { combineEpics, ofType } from 'redux-observable';
import { concat, concatMap, EMPTY, filter, forkJoin, ignoreElements, of, switchMap, take, tap } from 'rxjs';

import { errorsMessages } from '@/constants/errors';
import { ChatRootEpic } from '@/types/store';
import { ToastType } from '@/types/toasts';

import { ConversationActions, ConversationSelectors } from '../conversation/conversation.reducers';
import { MindmapActions } from '../mindmap/mindmap.reducers';
import { ChatUIActions } from './ui.reducers';

const resetEpic: ChatRootEpic = (action$, state$) =>
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

const showErrorToastEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ChatUIActions.showErrorToast.match),
    switchMap(({ payload }) => of(ChatUIActions.showToast({ message: payload, type: ToastType.Error }))),
  );

const showToastEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ChatUIActions.showToast.match),
    switchMap(({ payload }) => {
      return forkJoin({
        responseMessage:
          typeof payload.response !== 'undefined' ? (payload.response as Response).text() : of(undefined),
        payload: of(payload),
      });
    }),
    tap(({ payload, responseMessage }) => {
      let message = payload.message ?? errorsMessages.generalServer;
      if (payload.response && responseMessage && payload.response.status !== 504) {
        message = responseMessage;
      }

      const toastConfig: ToastOptions = {
        id: 'toast',
        className: 'chat-toast',
        icon: payload.icon,
      };

      switch (payload.type) {
        case ToastType.Error:
          toast.error(message, { ...toastConfig, id: ToastType.Error });
          break;
        case ToastType.Success:
          toast.success(message, { ...toastConfig, id: ToastType.Success });
          break;
        case ToastType.Warning:
          toast.loading(message, { ...toastConfig, id: ToastType.Warning });
          break;
        case ToastType.Loading:
          toast.loading(message, { ...toastConfig, id: ToastType.Loading });
          break;
        default:
          toast.loading(message, { ...toastConfig, id: ToastType.Info });
          break;
      }
    }),
    ignoreElements(),
  );

const saveThemeEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ChatUIActions.setTheme.match),
    tap(({ payload }) => {
      const theme = payload.startsWith('dark') ? 'dark' : 'light';
      // Needed for fast work with theme initial load
      document.documentElement.className = `${payload} ${theme}` || '';
    }),
    ignoreElements(),
  );

export const ChatUIEpics = combineEpics(resetEpic, showToastEpic, showErrorToastEpic, saveThemeEpic);
