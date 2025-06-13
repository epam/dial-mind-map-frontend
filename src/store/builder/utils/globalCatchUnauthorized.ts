import { Action } from 'redux';
import { catchError, Observable, of, throwError } from 'rxjs';

import { AuthActions } from '../auth/auth.slice';

export const globalCatchUnauthorized = <T>() =>
  catchError<T, Observable<Action>>((error: any) => {
    if (error.status === 401) {
      return of(AuthActions.redirectToSignin());
    }
    return throwError(() => error);
  });
