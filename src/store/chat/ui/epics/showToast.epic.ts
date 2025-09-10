import toast, { ToastOptions } from 'react-hot-toast';
import { filter, forkJoin, ignoreElements, of, switchMap, tap } from 'rxjs';

import { errorsMessages } from '@/constants/errors';
import { ChatRootEpic } from '@/types/store';
import { ToastType } from '@/types/toasts';

import { ChatUIActions } from '../ui.reducers';

export const showToastEpic: ChatRootEpic = action$ =>
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
