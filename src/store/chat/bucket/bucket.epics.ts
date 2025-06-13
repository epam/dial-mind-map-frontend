import { combineEpics } from 'redux-observable';
import { catchError, filter, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { ChatRootEpic } from '@/types/store';

import { selectIsAllowApiKey } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../utils/globalCatchUnauthorized';
import { BucketActions } from './bucket.reducer';

const fetchBucketEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BucketActions.fetchBucketStart.match),
    withLatestFrom(state$.pipe(map(selectIsAllowApiKey))),
    switchMap(([, isAllowApiKey]) => {
      if (isAllowApiKey) {
        return of(BucketActions.fetchBucketSuccess('default-bucket'));
      }

      return fromFetch('/api/bucket', { method: 'GET' }).pipe(
        mergeMap(response => checkForUnauthorized(response)),
        switchMap(response => response.json()),
        map((data: { bucket: string }) => BucketActions.fetchBucketSuccess(data.bucket)),
        globalCatchChatUnauthorized(),
        catchError((error: Error) => of(BucketActions.fetchBucketFailure(error.message))),
      );
    }),
  );

export const BucketEpics = combineEpics(fetchBucketEpic);
