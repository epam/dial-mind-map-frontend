import { Action } from 'redux';
import { catchError, concat, Observable, of, throwError } from 'rxjs';

import { chatAuthActions } from '../chatAuth/chatAuth.slice';
import { ChatUIActions } from '../ui/ui.reducers';

export const globalCatchChatUnauthorized = <T>() =>
  catchError<T, Observable<Action>>((error: any) => {
    if (error.status === 401) {
      return of(chatAuthActions.redirectToSignin());
    }
    if (error.status === 403) {
      return of(chatAuthActions.redirectToForbidden());
    }
    if (error.message === 'Failed to fetch') {
      return concat(
        of(ChatUIActions.setIsOffline(true)),
        throwError(() => error),
      );
    }
    return throwError(() => error);
  });
