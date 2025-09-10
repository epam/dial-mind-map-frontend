import { Action } from 'redux';
import { catchError, concat, Observable, of, throwError } from 'rxjs';

import { AuthActions } from '../auth/auth.slice';
import { UIActions } from '../ui/ui.reducers';

export const globalCatchUnauthorized = <T>() =>
  catchError<T, Observable<Action>>((error: any) => {
    if (error.status === 401) {
      return of(AuthActions.redirectToSignin());
    }
    if (error.status === 403) {
      return of(AuthActions.redirectToForbidden());
    }
    if (error.message === 'Failed to fetch') {
      return concat(
        of(UIActions.setIsOffline(true)),
        throwError(() => error),
      );
    }
    return throwError(() => error);
  });
