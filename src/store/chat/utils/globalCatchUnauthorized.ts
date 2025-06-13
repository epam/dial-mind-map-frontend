import { Action } from 'redux';
import { catchError, Observable, of, throwError } from 'rxjs';

import { chatAuthActions } from '../chatAuth/chatAuth.slice';

export const globalCatchChatUnauthorized = <T>() =>
  catchError<T, Observable<Action>>((error: any) => {
    if (error.status === 401) {
      return of(chatAuthActions.redirectToSignin());
    }
    return throwError(() => error);
  });
