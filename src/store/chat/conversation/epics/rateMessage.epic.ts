import { catchError, concat, EMPTY, filter, from, of, switchMap, throwError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { DeploymentIdHeaderName } from '@/constants/http';
import { LikeState, RateBody } from '@/types/chat';
import { HTTPMethod } from '@/types/http';
import { ChatRootEpic } from '@/types/store';

import { ApplicationSelectors } from '../../application/application.reducer';
import { ChatUIActions } from '../../ui/ui.reducers';
import { ConversationActions } from '../conversation.reducers';

export const rateMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.rateMessage.match),
    switchMap(({ payload }) => {
      const state = state$.value;
      const application = ApplicationSelectors.selectApplication(state);

      if (!application) {
        return throwError(() => new Error('Application is not available.'));
      }

      if (!payload.responseId) {
        return throwError(() => new Error('Message cannot be rated.'));
      }

      const rateBody: RateBody = {
        responseId: payload.responseId,
        value: payload.rate > 0,
        comment: payload.comment,
      };

      return fromFetch('/api/rate', {
        method: HTTPMethod.POST,
        headers: {
          'Content-Type': 'application/json',
          [DeploymentIdHeaderName]: application.name ?? application.application ?? '',
        },
        body: JSON.stringify(rateBody),
      }).pipe(
        switchMap(resp => {
          if (!resp.ok) {
            return throwError(() => resp);
          }
          return from(resp.json());
        }),
        switchMap(() => EMPTY),
        catchError(() =>
          of(
            ConversationActions.rateMessageFail({
              ...payload,
              error: 'Failed to rate message',
            }),
          ),
        ),
      );
    }),
  );

export const rateMessageSuccessEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ConversationActions.rateMessage.match),
    switchMap(({ payload }) => {
      return of(
        ConversationActions.updateMessage({
          messageIndex: payload.messageIndex,
          values: {
            like: payload.rate,
          },
        }),
      );
    }),
  );

export const rateMessageFailEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ConversationActions.rateMessageFail.match),
    switchMap(({ payload }) => {
      return concat(
        of(
          ConversationActions.updateMessage({
            messageIndex: payload.messageIndex,
            values: {
              like: LikeState.NoState,
            },
          }),
        ),
        of(ChatUIActions.showErrorToast(payload.error.toString())),
      );
    }),
  );
