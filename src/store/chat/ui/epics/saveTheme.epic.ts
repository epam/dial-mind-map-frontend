import { filter, ignoreElements, tap } from 'rxjs';

import { ChatRootEpic } from '@/types/store';

import { ChatUIActions } from '../ui.reducers';

export const saveThemeEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ChatUIActions.setThemeName.match),
    tap(({ payload }) => {
      const theme = payload.startsWith('dark') ? 'dark' : 'light';
      document.documentElement.className = `${payload} ${theme}`;
    }),
    ignoreElements(),
  );
