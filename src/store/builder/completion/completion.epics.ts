import { Action } from '@reduxjs/toolkit';
import { combineEpics } from 'redux-observable';
import {
  catchError,
  concat,
  filter,
  from,
  iif,
  map,
  mergeMap,
  of,
  Subject,
  switchMap,
  tap,
  throwError,
  TimeoutError,
} from 'rxjs';

import { errorsMessages } from '@/constants/errors';
import { DeploymentIdHeaderName } from '@/constants/http';
import { Attachment, ChatBody, Message, Role } from '@/types/chat';
import { NodesMIMEType } from '@/types/files';
import { Edge, Element, GraphElement, Node } from '@/types/graph';
import { BuilderRootEpic } from '@/types/store';
import { getNodeResponseId } from '@/utils/app/conversation';
import { isEdge } from '@/utils/app/graph/typeGuards';
import { mergeMessages, parseStreamMessages } from '@/utils/app/merge-streams';
import { isAbortError } from '@/utils/common/error';

import { ApplicationSelectors } from '../application/application.reducer';
import { BuilderActions } from '../builder/builder.reducers';
import { GraphActions, GraphSelectors } from '../graph/graph.reducers';
import { UIActions } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../utils/globalCatchUnauthorized';
import { CompletionActions } from './completion.reducers';

const completionStreamEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(CompletionActions.sendCompletionRequest.match),
    switchMap(({ payload }) => {
      const { userMessage, nodeId, customFields, updatedField } = payload;
      const assistantMessageId = getNodeResponseId(nodeId);
      const decoder = new TextDecoder();
      let eventData = '';

      const application = ApplicationSelectors.selectApplication(state$.value);
      const signal = state$.value.completion.abortController.signal;

      const body: ChatBody = {
        modelId: 'rail-mindmap',
        messages: [
          {
            role: Role.User,
            content: userMessage,
            custom_content: {
              attachments: [
                {
                  type: NodesMIMEType,
                  data: JSON.stringify([{ data: { id: nodeId } }]),
                } as Attachment,
              ],
            },
          },
        ],
        id: assistantMessageId.toLowerCase(),
        custom_fields: customFields,
      };

      return from(
        fetch('/api/chat/completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [DeploymentIdHeaderName]: application?.name || '',
          },
          body: JSON.stringify(body),
          signal,
        }),
      ).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(response => {
          if (!response.ok) {
            return throwError(() => new Error('ServerError', { cause: response }));
          }

          const reader = response.body?.getReader();
          if (!reader) {
            return throwError(() => new Error('NoBody'));
          }

          const subj = new Subject<ReadableStreamReadResult<Uint8Array>>();
          (async () => {
            try {
              while (true) {
                const val = await reader.read();
                subj.next(val);
                if (val.done) break;
              }
              subj.complete();
            } catch (e) {
              subj.error(e);
            }
          })();

          let message: Message = {
            id: assistantMessageId,
            role: Role.Assistant,
            content: '',
          };

          return subj.asObservable().pipe(
            mergeMap(val =>
              iif(
                () => val.done,
                of(val).pipe(
                  mergeMap(() => {
                    const chunks = parseStreamMessages(eventData);
                    const updatedMessage = mergeMessages(message, chunks);
                    message = updatedMessage;

                    const attachment = updatedMessage.custom_content?.attachments?.find(a => a.type === NodesMIMEType);
                    let elements: Element<GraphElement>[] = [];
                    try {
                      elements = attachment?.data ? JSON.parse(attachment.data) : [];
                    } catch {}

                    const nodes: Element<Node>[] = [];
                    const edges: Element<Edge>[] = [];
                    for (const el of elements) {
                      if (isEdge(el.data)) {
                        edges.push(el as Element<Edge>);
                      } else {
                        el.data.questions = el.data.questions ?? [userMessage] ?? [];
                        nodes.push(el as Element<Node>);
                      }
                    }

                    const actions: Action[] = [CompletionActions.streamCompletionSuccess()];

                    if (updatedField && nodes.length) {
                      const focusNode = GraphSelectors.selectFocusNode(state$.value);
                      const updatedValue = nodes[0].data[updatedField];

                      actions.push(
                        BuilderActions.updateNode({
                          ...focusNode,
                          [updatedField]: updatedValue,
                        }),
                      );
                    } else {
                      actions.push(GraphActions.addOrUpdateElements([...nodes, ...edges]));
                    }

                    return concat(actions);
                  }),
                ),
                of(val).pipe(
                  tap(resp => {
                    if (resp.value) {
                      eventData = decoder.decode(resp.value);
                    }
                  }),
                  filter(() => eventData.trim().endsWith('\0')),
                  map(() => {
                    const interimChunks = parseStreamMessages(eventData);
                    const interimMessage = mergeMessages(message, interimChunks);
                    message = interimMessage;
                    return CompletionActions.setSteamingContent({ content: interimMessage.content });
                  }),
                ),
              ),
            ),
          );
        }),
        globalCatchUnauthorized(),
        catchError(err => {
          if (isAbortError(err)) {
            return of(UIActions.showErrorToast('Generation was canceled.'));
          }
          if (err instanceof TimeoutError) {
            return of(UIActions.showErrorToast('Generation timed out. Please try again.'));
          }
          if (err.message === 'ServerError') {
            const cause = err.cause as Response | undefined;
            return from(cause?.json?.() ?? Promise.resolve({})).pipe(
              map((json: any) => json?.message || errorsMessages.generalServer),
              mergeMap(() => of(UIActions.showErrorToast('The model encountered an issue. Please retry.'))),
            );
          }
          return of(UIActions.showErrorToast('Something went wrong during generation.'));
        }),
      );
    }),
  );

const stopStreamingEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(CompletionActions.cancelStreaming.match),
    tap(() => {
      const controller = state$.value.completion.abortController;
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }),
    switchMap(() => {
      const focusNodeId = GraphSelectors.selectFocusNodeId(state$.value);
      return concat(of(UIActions.setIsNodeEditorOpen(false)), of(GraphActions.deleteElements([focusNodeId])));
    }),
  );

export const CompletionEpics = combineEpics(completionStreamEpic, stopStreamingEpic);
