import { catchError, concatMap, EMPTY, filter, from, map, merge, mergeMap, Observable, of, throwError } from 'rxjs';
import { endWith } from 'rxjs/operators';

import { BuilderRootEpic } from '@/types/store';
import { isAbortError, isNetworkError } from '@/utils/common/error';

import { ApplicationSelectors } from '../../application/application.reducer';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions } from '../builder.reducers';

export const subscribeMindmapEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.subscribe.match),
    map(() => ({
      name: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ name }) => {
      const controller = new AbortController();

      const sse$ = from(
        fetch(`/api/mindmaps/${encodeURIComponent(name)}/subscribe`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => {
          if (!resp.body) {
            return throwError(() => new Error('ReadableStream not supported'));
          }

          const reader = resp.body.getReader();
          const decoder = new TextDecoder('utf-8');

          const event$ = new Observable<string>(observer => {
            const read = async () => {
              try {
                let buffer = '';
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');

                  for (const line of lines) {
                    if (line.startsWith('data:')) {
                      observer.next(line.slice(5).trim());
                    }
                  }

                  buffer = lines[lines.length - 1];
                }
                observer.complete();
              } catch (error: any) {
                if (isAbortError(error) || isNetworkError(error)) {
                  observer.complete();
                  return;
                }
                console.error('SSE read error:', error);
                observer.error(error);
              }
            };

            read();
            return () => {
              controller.abort();
            };
          });

          return event$.pipe(
            map(data => {
              const parsedData = JSON.parse(data);
              return BuilderActions.update({ etag: parsedData.etag });
            }),
            catchError(error => {
              if (isAbortError(error) || isNetworkError(error)) {
                return of(BuilderActions.unsubscribe());
              }
              console.warn('SSE error:', error);
              return of(BuilderActions.unsubscribe());
            }),
            endWith(BuilderActions.unsubscribe()),
          );
        }),
        globalCatchUnauthorized(),
        catchError(error => {
          console.warn('Subscribe Error:', error);
          return of(BuilderActions.unsubscribe());
        }),
      );

      return merge(of(BuilderActions.subscribeStarted()), sse$);
    }),
    globalCatchUnauthorized(),
    catchError(err => {
      console.warn('Epic-level error in subscribeMindmapEpic:', err);
      return EMPTY;
    }),
  );
