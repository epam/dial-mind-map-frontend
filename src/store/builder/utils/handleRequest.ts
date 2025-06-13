import { Action } from 'redux';
import { StateObservable } from 'redux-observable';
import { catchError, concat, endWith, mergeMap, Observable, of, startWith, throwError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { delay, retry } from 'rxjs/operators';

import { EtagHeaderName, IfMatchHeaderName } from '@/constants/http';

import { BuilderActions, BuilderSelectors } from '../builder/builder.reducers';
import { checkForUnauthorized } from './checkForUnauthorized';
import { globalCatchUnauthorized } from './globalCatchUnauthorized';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

interface FetchError extends Error {
  status: number;
  newEtag?: string;
}

export const handleRequestNew = ({
  url,
  options,
  state$,
  optimisticActions = [],
  successActions = [],
  failureActions = [],
  responseProcessor,
  skipContentType = false,
}: {
  url: string;
  options: RequestInit;
  state$: StateObservable<any>;
  optimisticActions?: Action[];
  successActions?: Action[];
  failureActions?: Action[];
  responseProcessor?: (resp: Response) => Observable<Action>;
  skipContentType?: boolean;
}) =>
  handleRequest(
    url,
    options,
    state$,
    optimisticActions,
    successActions,
    failureActions,
    responseProcessor,
    skipContentType,
  );

export const handleRequest = (
  url: string,
  options: RequestInit,
  state$: StateObservable<any>,
  optimisticActions: Action[] = [],
  successActions: Action[] = [],
  failureActions: Action[] = [],
  responseProcessor?: (resp: Response) => Observable<Action>,
  skipContentType: boolean = false,
): Observable<Action> => {
  const makeRequest = (etag: string): Observable<Action> => {
    const updatedOptions = {
      ...options,
      headers: {
        ...options.headers,
        [IfMatchHeaderName]: etag,
      } as any,
    };

    if (!skipContentType) {
      updatedOptions.headers['Content-Type'] = 'application/json';
    }

    return fromFetch(url, updatedOptions).pipe(
      mergeMap(resp => checkForUnauthorized(resp)),
      mergeMap(resp => {
        if (!resp.ok) {
          if (resp.status === 412) {
            // Precondition Failed
            const newEtag = BuilderSelectors.selectEtag(state$.value) ?? '';
            return throwError(() => ({ status: 412, newEtag }) as FetchError);
          }
          return throwError(() => resp);
        }

        const newEtag = resp.headers.get(EtagHeaderName);

        const actions$ = responseProcessor
          ? concat(responseProcessor(resp), ...successActions.map(action => of(action)))
          : of(...successActions);

        return concat(of(BuilderActions.setEtag(newEtag)), actions$);
      }),
      globalCatchUnauthorized(),
      retry({
        count: MAX_RETRIES,
        delay: (error: FetchError, retryCount) => {
          if (error.status === 412 && retryCount < MAX_RETRIES + 1) {
            return of(error).pipe(delay(RETRY_DELAY_MS));
          }
          throw error;
        },
      }),
      catchError((e: FetchError) => {
        console.warn(e);
        return concat(...failureActions.map(action => of(action)));
      }),
      startWith(BuilderActions.setIsRequestInProgress(true)),
      endWith(BuilderActions.setIsRequestInProgress(false)),
    );
  };

  return concat(
    ...optimisticActions.map(action => of(action)),
    makeRequest(BuilderSelectors.selectEtag(state$.value) ?? ''),
  );
};
