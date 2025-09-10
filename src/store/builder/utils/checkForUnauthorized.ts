import { from, Observable, of, throwError } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

export const checkForUnauthorized = (resp: Response): Observable<Response> => {
  if (resp.status === 401) {
    if (resp.statusText === 'Unauthorized') {
      return throwError(() => ({ status: 401, body: { error: 'Unauthorized' } }));
    }
    return from(resp.json()).pipe(mergeMap(body => throwError(() => ({ status: 401, body }))));
  }
  if (resp.status === 403) {
    return from(resp.json()).pipe(mergeMap(body => throwError(() => ({ status: 403, body }))));
  }
  return of(resp);
};
