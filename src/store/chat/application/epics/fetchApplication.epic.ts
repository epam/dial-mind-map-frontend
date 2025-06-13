import { catchError, filter, map, mergeMap, of, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { Application } from '@/types/application';
import { ChatRootEpic } from '@/types/store';

import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../../utils/globalCatchUnauthorized';
import { ApplicationActions } from '../application.reducer';

export const fetchApplicationEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ApplicationActions.fetchApplicationStart.match),
    switchMap(({ payload: applicationId }) =>
      fromFetch(`/api/${applicationId}`, { method: 'GET' }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        switchMap(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch application: ${response.status}`);
          }
          return response.json();
        }),
        map((data: Application) => {
          return ApplicationActions.fetchApplicationSuccess(data);
        }),
        globalCatchChatUnauthorized(),
        catchError((error: Error) => of(ApplicationActions.fetchApplicationFailure(error.message))),
      ),
    ),
  );
