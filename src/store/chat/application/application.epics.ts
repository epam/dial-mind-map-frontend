import { combineEpics } from 'redux-observable';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  from,
  fromEvent,
  mergeMap,
  Observable,
  of,
  takeUntil,
  throwError,
} from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { ChatRootEpic } from '@/types/store';

import { MindmapActions } from '../mindmap/mindmap.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../utils/globalCatchUnauthorized';
import { ApplicationActions, ApplicationSelectors } from './application.reducer';
import { fetchApplicationEpic } from './epics/fetchApplication.epic';
import { fetchUpdatedApplicationEpic } from './epics/fetchUpdatedApplication.epic';

const subscribeEpic: ChatRootEpic = (action$, state$) => {
  return action$.pipe(
    filter(ApplicationActions.subscribe.match),
    concatMap(() => {
      const appPath = ApplicationSelectors.selectEncodedApplicationPath(state$.value);
      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder || !appPath) {
        return EMPTY;
      }

      return from(
        fetch(`/api/mindmaps/${appPath}/subscribe`, {
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

          const eventObservable = new Observable<string>(observer => {
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
                console.error(error);
                observer.error(error);
              }
            };

            read();
            return () => {
              reader.cancel();
            };
          });

          return eventObservable.pipe(
            takeUntil(fromEvent(window, 'beforeunload')),
            mergeMap(data => {
              const parsedData = JSON.parse(data as string);
              return of(ApplicationActions.compareUpdatedData({ updateEvent: parsedData }));
            }),
            catchError(error => {
              console.warn('SSE error:', error);
              return EMPTY;
            }),
          );
        }),
        globalCatchChatUnauthorized(),
        catchError(error => {
          console.warn('Subscribe Error:', error);
          return EMPTY;
        }),
      );
    }),
  );
};

const compareUpdatedDataEpic: ChatRootEpic = (action$, state$) => {
  return action$.pipe(
    filter(ApplicationActions.compareUpdatedData.match),
    mergeMap(({ payload: { updateEvent } }) => {
      const etag = ApplicationSelectors.selectEtag(state$.value);
      if (etag === updateEvent.etag) {
        return EMPTY;
      }
      // TODO: fetch updated application and graph and compare with current state

      return of(
        MindmapActions.fetchGraph(),
        ApplicationActions.fetchUpdatedApplication(),
        ApplicationActions.setEtag(updateEvent.etag),
      );
    }),
  );
};

export const ApplicationEpics = combineEpics(
  fetchApplicationEpic,
  subscribeEpic,
  fetchUpdatedApplicationEpic,
  compareUpdatedDataEpic,
);
