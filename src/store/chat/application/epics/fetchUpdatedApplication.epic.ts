import { catchError, concatMap, EMPTY, filter, map, mergeMap, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { Application } from '@/types/application';
import { ChatRootEpic } from '@/types/store';

import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../../utils/globalCatchUnauthorized';
import { ApplicationActions, ApplicationSelectors } from '../application.reducer';

export const fetchUpdatedApplicationEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ApplicationActions.fetchUpdatedApplication.match),
    concatMap(() => {
      const appPath = ApplicationSelectors.selectAppName(state$.value);
      if (!appPath) {
        return EMPTY;
      }

      return fromFetch(`/api/${appPath}`, { method: 'GET' }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        switchMap(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch updated application: ${response.status}`);
          }
          return response.json();
        }),
        map((data: Application) => ApplicationActions.fetchUpdatedApplicationSuccess(data)),
        globalCatchChatUnauthorized(),
        catchError((error: Error) => {
          console.warn('Fetch updated application error:', error);
          return EMPTY;
        }),
      );
    }),
  );
