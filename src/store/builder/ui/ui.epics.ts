import { toast, ToastOptions } from 'react-hot-toast';
import { combineEpics } from 'redux-observable';
import { concatMap, EMPTY, filter, forkJoin, ignoreElements, of, switchMap, tap } from 'rxjs';

import { errorsMessages } from '@/constants/errors';
import { BuilderRootEpic } from '@/types/store';
import { ToastType } from '@/types/toasts';

import { GraphActions } from '../graph/graph.reducers';
import { UIActions } from './ui.reducers';

const saveThemeEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(UIActions.setTheme.match),
    tap(({ payload }) => {
      const theme = payload.startsWith('dark') ? 'dark' : 'light';

      // Needed for fast work with theme initial load
      document.documentElement.className = `${payload} ${theme}` || '';
      // for @uiw/react-md-editor themes
      // https://github.com/uiwjs/react-md-editor?tab=readme-ov-file#support-dark-modenight-mode
      document.documentElement.setAttribute('data-color-mode', theme);
    }),
    ignoreElements(),
  );

const setAreGeneretedEdgesShowenEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(UIActions.setAreGeneretedEdgesShowen.match),
    switchMap(({ payload }) => {
      return payload.skipRefresh ? EMPTY : of(GraphActions.refresh());
    }),
  );

const showErrorToastEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(UIActions.showErrorToast.match),
    switchMap(({ payload }) => of(UIActions.showToast({ message: payload, type: ToastType.Error }))),
  );

const showToastEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(UIActions.showToast.match),
    concatMap(({ payload }) => {
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
        className: 'chat-toast',
        icon: payload.icon,
        duration: payload.duration,
      };

      switch (payload.type) {
        case ToastType.Error:
          toast.error(message, { ...toastConfig });
          break;
        case ToastType.Success:
          toast.success(message, { ...toastConfig });
          break;
        default:
          toast.loading(message, { ...toastConfig });
          break;
      }
    }),
    ignoreElements(),
  );

export const UIEpics = combineEpics(saveThemeEpic, setAreGeneretedEdgesShowenEpic, showToastEpic, showErrorToastEpic);
