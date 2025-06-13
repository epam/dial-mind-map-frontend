import { catchError, concatMap, EMPTY, filter, from, map, merge, mergeMap, Observable, of, throwError } from 'rxjs';
import { endWith } from 'rxjs/operators';

import { MindmapUrlHeaderName } from '@/constants/http';
import { BuilderRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { checkForUnauthorized } from '../../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../../utils/globalCatchUnauthorized';
import { BuilderActions } from '../builder.reducers';

export const subscribeMindmapEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.subscribe.match),
    map(() => ({
      name: ApplicationSelectors.selectApplicationName(state$.value),
      mindmapFolder: ApplicationSelectors.selectMindmapFolder(state$.value),
    })),
    concatMap(({ name, mindmapFolder }) => {
      if (!mindmapFolder) {
        return EMPTY;
      }

      const sse$ = from(
        fetch(`/api/mindmaps/${encodeURIComponent(name)}/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [MindmapUrlHeaderName]: mindmapFolder,
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

          return new Observable<string>(observer => {
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
                      const jsonData = line.slice(5).trim();
                      observer.next(jsonData);
                    }
                  }

                  buffer = lines[lines.length - 1];
                }
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            };
            read();
            return () => reader.cancel();
          }).pipe(
            map(data => {
              const parsedData = JSON.parse(data);
              return BuilderActions.update({ etag: parsedData.etag });
            }),
            catchError(error => {
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
