import { filter, of, switchMap } from 'rxjs';

import { ChatRootEpic } from '@/types/store';
import { ToastType } from '@/types/toasts';

import { ChatUIActions } from '../ui.reducers';

export const showErrorToastEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ChatUIActions.showErrorToast.match),
    switchMap(({ payload }) => of(ChatUIActions.showToast({ message: payload, type: ToastType.Error }))),
  );
