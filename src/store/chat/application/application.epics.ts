import { UnknownAction } from '@reduxjs/toolkit';
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

import { ChatRootEpic } from '@/types/store';
import { isAbortError, isNetworkError } from '@/utils/common/error';

import { ConversationSelectors } from '../conversation/conversation.reducers';
import { MindmapActions, MindmapSelectors } from '../mindmap/mindmap.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../utils/globalCatchUnauthorized';
import { ApplicationActions, ApplicationSelectors } from './application.reducer';
import { fetchApplicationEpic } from './epics/fetchApplication.epic';
import { fetchUpdatedApplicationEpic } from './epics/fetchUpdatedApplication.epic';

const subscribeEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ApplicationActions.subscribe.match),
    concatMap(() => {
      const appPath = ApplicationSelectors.selectEncodedApplicationPath(state$.value);
      const controller = new AbortController();

      return from(
        fetch(`/api/mindmaps/${appPath}/subscribe`, {
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

          return eventObservable.pipe(
            takeUntil(fromEvent(window, 'beforeunload')),
            mergeMap(data => {
              const parsedData = JSON.parse(data);
              return of(ApplicationActions.compareUpdatedData({ updateEvent: parsedData }));
            }),
            catchError(error => {
              if (isAbortError(error) || isNetworkError(error)) {
                return EMPTY;
              }
              console.warn('SSE error:', error);
              return EMPTY;
            }),
          );
        }),
        globalCatchChatUnauthorized(),
        catchError(error => {
          console.warn('Subscribe error:', error);
          return EMPTY;
        }),
      );
    }),
  );

const compareUpdatedDataEpic: ChatRootEpic = (action$, state$) => {
  return action$.pipe(
    filter(ApplicationActions.compareUpdatedData.match),
    mergeMap(({ payload: { updateEvent } }) => {
      const etag = ApplicationSelectors.selectEtag(state$.value);
      if (etag === updateEvent.etag) {
        return EMPTY;
      }
      // TODO: fetch updated application and graph and compare with current state

      const actions: UnknownAction[] = [];
      const isMessageStreaming = ConversationSelectors.selectIsMessageStreaming(state$.value);
      const isGraphFetching = MindmapSelectors.selectIsGraphFetching(state$.value);

      if (!isMessageStreaming && !isGraphFetching) {
        actions.push(MindmapActions.fetchGraph());
      }

      actions.push(ApplicationActions.fetchUpdatedApplication(), ApplicationActions.setEtag(updateEvent.etag));

      return from(actions);
    }),
  );
};

export const ApplicationEpics = combineEpics(
  fetchApplicationEpic,
  subscribeEpic,
  fetchUpdatedApplicationEpic,
  compareUpdatedDataEpic,
);
