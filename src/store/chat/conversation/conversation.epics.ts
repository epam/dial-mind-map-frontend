import { UnknownAction } from '@reduxjs/toolkit';
import { combineEpics } from 'redux-observable';
import {
  catchError,
  concat,
  concatMap,
  EMPTY,
  filter,
  from,
  iif,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
  timeout,
  TimeoutError,
  withLatestFrom,
} from 'rxjs';

import { errorsMessages } from '@/constants/errors';
import {
  AnonymSessionCSRFTokenHeaderName,
  DeploymentIdHeaderName,
  RecaptchaRequiredHeaderName,
} from '@/constants/http';
import { ChatBody, Conversation, Message, PlaybackAction, PlaybackActionType, Role, ViewState } from '@/types/chat';
import { EntityType } from '@/types/common';
import { DialAIError } from '@/types/error';
import { NodesMIMEType } from '@/types/files';
import { Element, Node } from '@/types/graph';
import { ChatRootEpic } from '@/types/store';
import { cleanGraphElementsForPlayback } from '@/utils/app/clean';
import { generateUniqueConversationName } from '@/utils/app/conversation';
import { ConversationService } from '@/utils/app/data/conversation-service';
import { isEntityIdLocal } from '@/utils/app/id';
import { mergeMessages, parseStreamMessages } from '@/utils/app/merge-streams';

import { anonymSessionActions, AnonymSessionSelectors } from '../anonymSession/anonymSession.slice';
import { ApplicationSelectors } from '../application/application.reducer';
import { BucketSelectors } from '../bucket/bucket.reducer';
import { MindmapActions, MindmapSelectors } from '../mindmap/mindmap.reducers';
import { PlaybackSelectors } from '../playback/playback.selectors';
import { ChatUIActions, ChatUISelectors } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../utils/globalCatchUnauthorized';
import { ConversationActions, ConversationSelectors } from './conversation.reducers';
import { getConversationsEpic } from './epics/getConversations.epic';
import { initEpic } from './epics/init.epic';
import { resetConversationEpic } from './epics/resetConversation.epic';
import { sendMessageEpic } from './epics/sendMessage.epic';
import { sendMessagesEpic } from './epics/sendMessages.epic';
import { updateMessageEpic } from './epics/updateMessage.epic';
import { updateResponseOfMessageEpic } from './epics/updateResponseOfMessage.epic';

const streamMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.streamMessage.match),
    map(({ payload }) => ({ payload })),
    map(({ payload }) => {
      const lastModel = {
        type: EntityType.Model,
        features: { systemPrompt: undefined },
      };
      const conversationModelType = lastModel?.type ?? EntityType.Model;
      let modelAdditionalSettings = {};

      if (conversationModelType === EntityType.Model) {
        modelAdditionalSettings = {
          prompt: lastModel?.features?.systemPrompt ? payload.conversation.prompt : undefined,
          temperature: payload.conversation.temperature,
        };
      }

      const chatBody: ChatBody = {
        modelId: payload.conversation.model.id,
        messages: payload.conversation.messages
          .filter(
            (message, index) => message.role !== Role.Assistant || index !== payload.conversation.messages.length - 1,
          )
          .map(
            message =>
              ({
                content: message.content,
                role: message.role,
                custom_content: {
                  attachments: [
                    {
                      type: NodesMIMEType,
                      data: JSON.stringify([
                        {
                          data: {
                            id: message.id,
                          },
                        } as Element<Node>,
                      ]),
                    },
                  ],
                },
              }) as Message,
          ),
        custom_fields: payload.customFields,
        id: payload.conversation.id.toLowerCase(),
        captchaToken: payload.captchaToken,
        ...modelAdditionalSettings,
      };

      return { payload, chatBody };
    }),
    mergeMap(({ payload, chatBody }) => {
      const conversationSignal = ConversationSelectors.selectConversationSignal(state$.value);
      const anonymCsrfToken = AnonymSessionSelectors.selectAnonymSessionCsrfToken(state$.value);
      const decoder = new TextDecoder();
      let eventData = '';
      let message = payload.message;

      const application = ApplicationSelectors.selectApplication(state$.value);
      return from(
        fetch('api/chat/completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [DeploymentIdHeaderName]: application?.name ?? application?.application ?? '',
            [AnonymSessionCSRFTokenHeaderName]: anonymCsrfToken,
          },
          body: JSON.stringify(chatBody),
          signal: conversationSignal.signal,
        }),
      ).pipe(
        mergeMap(response => checkForUnauthorized(response)),
        mergeMap(response => {
          const body = response.body;

          if (!response.ok) {
            return throwError(() => new Error('ServerError', { cause: response }));
          }
          if (!body) {
            return throwError(() => new Error('No body received'));
          }

          const reader = body.getReader();
          const subj = new Subject<ReadableStreamReadResult<Uint8Array>>();
          const observable = subj.asObservable();
          const observer = async () => {
            try {
              while (true) {
                const val = await reader.read();
                subj.next(val);
                if (val.done) {
                  subj.complete();
                  break;
                }
              }
            } catch (e) {
              subj.error(e);
              subj.complete();
            }
          };
          observer();

          return observable.pipe(
            map(val => ({
              isRecaptchaRequired: Boolean(response.headers.get(RecaptchaRequiredHeaderName)),
              anonymCsrfToken: String(response.headers.get(AnonymSessionCSRFTokenHeaderName)),
              resp: val,
            })),
          );
        }),
        // TODO: https://github.com/epam/ai-dial-chat/issues/115
        timeout(120000),
        mergeMap(({ resp, isRecaptchaRequired, anonymCsrfToken }) =>
          iif(
            () => resp.done,
            concat(
              of(
                ConversationActions.updateConversation({
                  values: { isMessageStreaming: false },
                }),
              ),
              of(ConversationActions.streamMessageSuccess()),
              of(anonymSessionActions.setIsRecaptchaRequired(isRecaptchaRequired)),
              of(anonymSessionActions.setAnonymCsrfToken(anonymCsrfToken)),
            ),
            concat(
              of(anonymSessionActions.setIsRecaptchaRequired(isRecaptchaRequired)),
              of(anonymSessionActions.setAnonymCsrfToken(anonymCsrfToken)),
              of(resp).pipe(
                tap(() => {
                  const decodedValue = decoder.decode(resp.value);
                  eventData += decodedValue;
                }),
                filter(() => eventData[eventData.length - 1] === '\0' || eventData.includes('event: errordata:')),
                mergeMap(() => {
                  if (eventData.includes('event: errordata:')) {
                    const start = eventData.indexOf('{"errorBody":');
                    const jsonStr = eventData.substring(start);
                    const payload = JSON.parse(jsonStr);
                    const errMsg = payload.errorBody?.errorMessage || payload.error || 'Stream error';
                    const code = payload.status ?? payload.code ?? 500;
                    eventData = '';
                    return throwError(() => new DialAIError(errMsg, 'streamMessageEpic', '', code.toString()));
                  }

                  const chunkValue = parseStreamMessages(eventData);
                  return of({
                    updatedMessage: mergeMessages(message, chunkValue),
                    isCompleted: resp.done,
                  });
                }),
                tap(({ updatedMessage }) => {
                  eventData = '';
                  message = updatedMessage;
                }),
                map(({ updatedMessage }) => {
                  const index = payload.conversation.messages.findIndex(m => m.id === updatedMessage.id);
                  return ConversationActions.updateMessage({
                    messageIndex: index,
                    values: updatedMessage,
                  });
                }),
              ),
            ),
          ),
        ),
        globalCatchChatUnauthorized(),
        catchError((error: Error | DialAIError) => {
          if (error.name === 'AbortError') {
            return of(
              ConversationActions.updateConversation({
                values: { isMessageStreaming: false },
              }),
            );
          }

          if (error instanceof TimeoutError) {
            return of(
              ConversationActions.streamMessageFail({
                conversation: payload.conversation,
                message: errorsMessages.timeoutError,
              }),
            );
          }

          if (error instanceof DialAIError && error.code === '429' && error.message) {
            const graphElements = MindmapSelectors.selectFallbackElements(state$.value);
            const focusNodeId = MindmapSelectors.selectPreviousFocusNodeId(state$.value);
            const actions: Observable<UnknownAction>[] = [
              of(
                ConversationActions.streamMessageFail({
                  conversation: payload.conversation,
                  message: error.message,
                }),
              ),
            ];
            if (graphElements.length > 0) {
              actions.push(of(MindmapActions.setGraphElements(graphElements)));
            }
            if (focusNodeId) {
              actions.push(of(MindmapActions.setFocusNodeId(focusNodeId)));
            }
            return concat(...actions);
          }

          if (error.message === 'ServerError') {
            return of(
              ConversationActions.streamMessageFail({
                conversation: payload.conversation,
                message:
                  (!!error.cause && (error.cause as { message?: string }).message) || errorsMessages.generalServer,
                response: error.cause instanceof Response ? error.cause : undefined,
              }),
            );
          }

          return of(
            ConversationActions.streamMessageFail({
              conversation: payload.conversation,
              message: errorsMessages.generalClient,
            }),
          );
        }),
      );
    }),
  );

const streamMessageFailEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ConversationActions.streamMessageFail.match),
    switchMap(({ payload }) => {
      return (payload.response ? from(payload.response.json()) : of(undefined)).pipe(
        map((response: { message: string } | undefined) => ({
          payload,
          responseJSON: response,
        })),
      );
    }),
    switchMap(({ payload, responseJSON }) => {
      const errorMessage = responseJSON?.message || payload.message;

      const messages = [...payload.conversation.messages];
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        errorMessage,
      };

      const values: Partial<Conversation> = {
        isMessageStreaming: false,
        messages: [...messages],
      };

      return concat(
        of(
          ConversationActions.updateConversation({
            values,
          }),
        ),
        of(
          ConversationActions.updateMessage({
            messageIndex: payload.conversation.messages.length - 1,
            values: {
              errorMessage,
            },
          }),
        ),
      );
    }),
  );

const addOrUpdateMessagesEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.addOrUpdateMessages.match),
    map(({ payload }) => ({
      payload,
      conversation: ConversationSelectors.selectConversation(state$.value),
    })),
    switchMap(({ payload, conversation }) => {
      const { messages } = conversation;
      const { messages: newMessages, isInitialization, needToUpdateInBucket } = payload;
      const updatedMessages = [...messages];

      newMessages.forEach(message => {
        const idx = updatedMessages.findIndex(
          m => m.id === message.id || (m.role === message.role && m.content === message.content),
        );
        if (idx !== -1) {
          updatedMessages[idx] = {
            ...updatedMessages[idx],
            ...message,
            content: message.content || updatedMessages[idx].content,
            availableNodes: message.availableNodes ?? updatedMessages[idx].availableNodes,
            references: message.references ?? updatedMessages[idx].references,
          };
        } else {
          updatedMessages.push(message);
        }
      });

      return of(
        ConversationActions.updateConversation({
          values: { messages: updatedMessages },
          isInitialization,
          needToUpdateInBucket,
        }),
      );
    }),
  );

const deleteMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.deleteMessage.match),
    map(({ payload }) => ({
      payload,
      conversation: ConversationSelectors.selectConversation(state$.value),
    })),
    switchMap(({ payload, conversation: conv }) => {
      const { messages } = conv;
      let newMessages = [];

      if (payload.index < messages.length - 1 && messages[payload.index + 1].role === Role.Assistant) {
        newMessages = messages.filter((message, index) => index !== payload.index && index !== payload.index + 1);
      } else {
        newMessages = messages.filter((message, index) => index !== payload.index);
      }

      return of(
        ConversationActions.updateConversation({
          values: {
            messages: newMessages,
          },
        }),
      );
    }),
  );

const updateConversationEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.updateConversation.match),
    withLatestFrom(state$.pipe(map(ChatUISelectors.selectIsAllowApiKey))),

    mergeMap(([action, isAllowApiKey]) => {
      const { payload } = action;
      const conversation = ConversationSelectors.selectConversation(state$.value);
      const bucketId = BucketSelectors.selectBucketId(state$.value);
      const applicationReference = ApplicationSelectors.selectApplication(state$.value)?.reference;

      const isPlayback = PlaybackSelectors.selectIsPlayback(state$.value);
      if (isPlayback) {
        return EMPTY;
      }

      const { values } = payload;

      const newConversation: Conversation = {
        ...conversation,
        ...values,
        lastActivityDate: Date.now(),
      };

      const isPreview = ChatUISelectors.selectIsPreview(state$.value);

      if (payload.isInitialization) {
        if (!newConversation.id && !isPreview && !conversation.customViewState.playbackActions) {
          const mindmapElements = MindmapSelectors.selectGraphElements(state$.value);
          const depth = MindmapSelectors.selectDepth(state$.value);
          const playbackActions = [
            {
              type: PlaybackActionType.Init,
              mindmap: {
                elements: cleanGraphElementsForPlayback(mindmapElements),
                focusNodeId: '',
                visitedNodes: {},
                depth,
              },
            },
          ];
          return of(
            ConversationActions.updateConversationSuccess({
              conversation: {
                ...newConversation,
                customViewState: { ...newConversation.customViewState, playbackActions },
              },
            }),
          );
        }

        return of(
          ConversationActions.updateConversationSuccess({
            conversation: newConversation,
          }),
        );
      }

      if (!newConversation.id && !conversation.isMessageStreaming && !isPreview) {
        if (values.messages && values.messages.filter(message => message.content).length >= 4) {
          const conversationNames = ConversationSelectors.selectConversations(state$.value).map(c => c.name);
          const lastUserMessage = values.messages.filter(m => m.role === Role.User).at(-1);

          const newConversationName = generateUniqueConversationName(
            lastUserMessage?.content ?? 'New conversation',
            conversationNames,
            isAllowApiKey,
          );

          const conversationNamePrefix = isAllowApiKey ? '' : '__';

          if (!applicationReference) {
            return EMPTY;
          }

          const mindmapElements = MindmapSelectors.selectGraphElements(state$.value);
          const visitedNodes = MindmapSelectors.selectVisitedNodes(state$.value);
          const focusNodeId = MindmapSelectors.selectFocusNodeId(state$.value);
          const hasMessageInConversation = newConversation.messages.some(
            (message, index) => message.id === focusNodeId && index < newConversation.messages.length - 2,
          );
          const depth = MindmapSelectors.selectDepth(state$.value);
          const playbackActions: PlaybackAction[] = [
            {
              type: PlaybackActionType.FillInput,
              mindmap: {
                elements: cleanGraphElementsForPlayback(mindmapElements),
                focusNodeId,
                visitedNodes,
                depth,
              },
            },
            {
              type: hasMessageInConversation
                ? PlaybackActionType.ChangeFocusNode
                : PlaybackActionType.UpdateConversation,
              mindmap: {
                elements: cleanGraphElementsForPlayback(mindmapElements),
                focusNodeId,
                visitedNodes,
                depth,
              },
            },
          ];

          const customViewState: ViewState = {
            ...conversation.customViewState,
            playbackActions: [...(newConversation.customViewState.playbackActions ?? []), ...playbackActions],
          };

          const createdConversation: Conversation = {
            id: `conversations/${bucketId}/${applicationReference}${conversationNamePrefix}${newConversationName}`,
            name: `${newConversationName}`,
            messages: values.messages,
            folderId: `conversations/${bucketId}`,
            lastActivityDate: Date.now(),
            updatedAt: Date.now(),
            model: { id: applicationReference },
            prompt: newConversation.prompt || '',
            temperature: newConversation.temperature || 1,
            customViewState: customViewState,
            selectedAddons: newConversation.selectedAddons || [],
          };

          return concat(
            of(ConversationActions.createConversation(createdConversation)),
            of(
              ConversationActions.updateConversationSuccess({
                conversation: {
                  ...createdConversation,
                },
              }),
            ),
          ).pipe(
            catchError(() =>
              of(
                ConversationActions.updateConversationFail({
                  error: 'Failed to create conversation.',
                }),
              ),
            ),
          );
        } else {
          return of(
            ConversationActions.updateConversationSuccess({
              conversation: {
                ...values,
                id: newConversation.id,
              },
            }),
          );
        }
      }
      const mindmapElements = MindmapSelectors.selectGraphElements(state$.value);
      const visitedNodes = MindmapSelectors.selectVisitedNodes(state$.value);
      const focusNodeId = MindmapSelectors.selectFocusNodeId(state$.value);
      const hasMessageInConversation = newConversation.messages.some(
        (message, index) => message.id === focusNodeId && index < newConversation.messages.length - 2,
      );
      const depth = MindmapSelectors.selectDepth(state$.value);
      const lastActionDepth = newConversation.customViewState.playbackActions?.at(-1)?.mindmap.depth;
      const playbackActions: PlaybackAction[] = [];
      if (lastActionDepth === depth) {
        playbackActions.push(
          {
            type: PlaybackActionType.FillInput,
            mindmap: {
              elements: cleanGraphElementsForPlayback(mindmapElements),
              focusNodeId,
              visitedNodes,
              depth: depth,
            },
          },
          {
            type: hasMessageInConversation ? PlaybackActionType.ChangeFocusNode : PlaybackActionType.UpdateConversation,
            mindmap: {
              elements: cleanGraphElementsForPlayback(mindmapElements),
              focusNodeId,
              visitedNodes,
              depth: depth,
            },
          },
        );
      } else {
        playbackActions.push({
          type: PlaybackActionType.ChangeDepth,
          mindmap: {
            elements: cleanGraphElementsForPlayback(mindmapElements),
            focusNodeId,
            visitedNodes,
            depth: depth,
          },
        });
      }

      const updatedCustomViewState: ViewState = {
        ...conversation.customViewState,
        playbackActions: [...(conversation.customViewState.playbackActions ?? []), ...playbackActions],
      };

      newConversation.customViewState =
        payload.needToUpdateInBucket && !conversation.isMessageStreaming
          ? updatedCustomViewState
          : newConversation.customViewState;

      return concat(
        of(
          ConversationActions.saveConversation({
            conversation: newConversation,
            needToUpdateInBucket: payload.needToUpdateInBucket,
          }),
        ),
        of(
          ConversationActions.updateConversationSuccess({
            conversation: newConversation,
          }),
        ),
        action$.pipe(
          filter(ConversationActions.saveConversationSuccess.match),
          take(1),
          tap(({ payload: { conversation } }) => {
            const dialHost = ChatUISelectors.selectDialChatHost(state$.value);
            const mindmapIframeTitle = ChatUISelectors.selectMindmapIframeTitle(state$.value);
            window?.parent.postMessage(
              {
                type: `${mindmapIframeTitle}/UPDATED_CONVERSATION_SUCCESS`,
                payload: { conversation: { ...newConversation, updatedAt: conversation.updatedAt } },
              },
              dialHost,
            );
          }),
          catchError(() =>
            of(
              ConversationActions.updateConversationFail({
                error: 'Failed to save conversation.',
              }),
            ),
          ),
        ),
      );
    }),
  );

const createConversationEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.createConversation.match),
    concatMap(({ payload: newConversation }) =>
      ConversationService.createConversation(newConversation).pipe(
        tap(() => {
          const dialHost = ChatUISelectors.selectDialChatHost(state$.value);
          const mindmapIframeTitle = ChatUISelectors.selectMindmapIframeTitle(state$.value);
          window?.parent.postMessage(
            {
              type: `${mindmapIframeTitle}/CREATED_CONVERSATION_SUCCESS`,
              payload: { conversation: newConversation },
            },
            dialHost,
          );
        }),
        switchMap(() =>
          of(
            ConversationActions.updateConversationSuccess({
              conversation: { ...newConversation },
            }),
          ),
        ),
        catchError(() => of(ChatUIActions.showErrorToast('An error occurred while setting up a new conversation.'))),
      ),
    ),
  );

const saveConversationEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.saveConversation.match),
    filter(action => !action.payload.conversation.isMessageStreaming), // shouldn't save during streaming
    filter(action => action.payload.conversation.messages.at(-1)?.role !== Role.User),
    map(({ payload }) => ({
      isPlayback: PlaybackSelectors.selectIsPlayback(state$.value),
      payload,
    })),
    concatMap(({ payload, isPlayback }) => {
      const { conversation, needToUpdateInBucket } = payload;
      if (isEntityIdLocal(conversation) || !conversation.id || !needToUpdateInBucket || isPlayback) {
        return EMPTY;
      }

      return ConversationService.updateConversation(conversation).pipe(
        map(response => ConversationActions.saveConversationSuccess({ conversation: { ...response } })),
        catchError(() => {
          return of(ChatUIActions.showErrorToast('An error occurred while saving the conversation.'));
        }),
      );
    }),
  );

export const ConversationEpics = combineEpics(
  initEpic,
  updateConversationEpic,
  updateResponseOfMessageEpic,
  updateMessageEpic,
  sendMessageEpic,
  sendMessagesEpic,
  streamMessageEpic,
  streamMessageFailEpic,
  deleteMessageEpic,
  addOrUpdateMessagesEpic,
  saveConversationEpic,
  createConversationEpic,
  getConversationsEpic,
  resetConversationEpic,
);
