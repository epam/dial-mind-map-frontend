import { UnknownAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import { combineEpics } from 'redux-observable';
import {
  catchError,
  concat,
  concatMap,
  EMPTY,
  filter,
  forkJoin,
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

import { AI_ROBOT_ICON_NAME } from '@/constants/app';
import { errorsMessages } from '@/constants/errors';
import {
  AnonymSessionCSRFTokenHeaderName,
  DeploymentIdHeaderName,
  RecaptchaRequiredHeaderName,
} from '@/constants/http';
import { AttachmentTitle, ChatBody, Conversation, Message, Role } from '@/types/chat';
import { EntityType } from '@/types/common';
import { DialAIError } from '@/types/error';
import { NodesMIMEType } from '@/types/files';
import { Edge, Element, GraphElement, Node } from '@/types/graph';
import { StorageType } from '@/types/storage';
import { ChatRootEpic } from '@/types/store';
import {
  generateUniqueConversationName,
  getConversationInfoFromId,
  getFocusNodeResponseId,
  getLocalConversationInfo,
} from '@/utils/app/conversation';
import { ConversationService } from '@/utils/app/data/conversation-service';
import { DataService } from '@/utils/app/data/data-service';
import { adjustVisitedNodes } from '@/utils/app/graph/common';
import { isEdge } from '@/utils/app/graph/typeGuards';
import { isEntityIdLocal } from '@/utils/app/id';
import { mergeMessages, parseStreamMessages } from '@/utils/app/merge-streams';

import { anonymSessionActions, AnonymSessionSelectors } from '../anonymSession/anonymSession.slice';
import { ApplicationActions, ApplicationSelectors } from '../application/application.reducer';
import { BucketActions, BucketSelectors } from '../bucket/bucket.reducer';
import { MindmapActions, MindmapSelectors } from '../mindmap/mindmap.reducers';
import { ChatUIActions, ChatUISelectors, selectIsAllowApiKey } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../utils/globalCatchUnauthorized';
import { ConversationActions, ConversationInitialState, ConversationSelectors } from './conversation.reducers';

type AppActions =
  | ReturnType<typeof MindmapActions.fetchGraph>
  | ReturnType<typeof ConversationActions.getConversations>
  | ReturnType<typeof ApplicationActions.fetchApplicationStart>
  | ReturnType<typeof ConversationActions.initConversation>
  | ReturnType<typeof ApplicationActions.subscribe>;

const initEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.init.match),

    switchMap(({ payload }) => {
      return concat(
        of(BucketActions.fetchBucketStart()).pipe(),

        action$.pipe(
          filter(BucketActions.fetchBucketSuccess.match),
          take(1),
          withLatestFrom(state$),
          switchMap(() => {
            return concat(
              of(ApplicationActions.fetchApplicationStart(payload.applicationId)).pipe(),
              action$.pipe(
                filter(ApplicationActions.fetchApplicationSuccess.match),
                take(1),
                withLatestFrom(state$),
                switchMap(([, state]) => {
                  const isAllowApiKey = ChatUISelectors.selectIsAllowApiKey(state);
                  const application = ApplicationSelectors.selectApplication(state);

                  // If API key is allowed, we need to initialize DataService with BrowserStorage
                  if (isAllowApiKey) {
                    DataService.init(StorageType.BrowserStorage);
                  }

                  const conversationInfo = isAllowApiKey
                    ? getLocalConversationInfo(application)
                    : getConversationInfoFromId(payload.conversationId);

                  const independentActions = forkJoin({
                    mindmap: of(MindmapActions.fetchGraph()),
                    getConversations: of(ConversationActions.getConversations()),
                    subscribe: of(ApplicationActions.subscribe()),
                  });

                  const conversationAction =
                    (conversationInfo.bucket !== 'local' && payload.conversationId) ||
                    conversationInfo.bucket === 'default-bucket'
                      ? ConversationService.getConversation(conversationInfo).pipe(
                          map(conversation =>
                            conversation ? ConversationActions.initConversation(conversation) : null,
                          ),
                          catchError(() => {
                            console.warn("⚠️ Can't retrieve conversation");
                            return of(null);
                          }),
                        )
                      : of(null);

                  return forkJoin({ independent: independentActions, conversation: conversationAction }).pipe(
                    switchMap(({ independent, conversation }) => {
                      const hasAppProperties = ApplicationSelectors.selectHasAppProperties(state);
                      const actions: AppActions[] = [independent.getConversations, independent.subscribe];

                      if (hasAppProperties) {
                        actions.unshift(independent.mindmap);
                      }

                      if (conversation) {
                        actions.unshift(conversation);
                      }
                      return from(actions);
                    }),
                  );
                }),
              ),
            );
          }),
        ),
      );
    }),
  );

const updateResponseOfMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.updateResponseOfMessage.match),
    switchMap(action => {
      const { payload } = action;
      const conversation = ConversationSelectors.selectConversation(state$.value);

      const { values, messageId } = payload;
      const userMessageIndex = conversation.messages.findIndex(m => m.id === messageId);
      const responseMessageIndex = userMessageIndex + 1;

      if (conversation.messages.length >= responseMessageIndex) {
        return of(
          ConversationActions.updateMessage({
            values: values,
            messageIndex: responseMessageIndex,
          }),
        );
      }
      return EMPTY;
    }),
  );

const updateMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.updateMessage.match),
    map(({ payload }) => ({
      payload,
      conversation: ConversationSelectors.selectConversation(state$.value),
      focusNodeId: MindmapSelectors.selectFocusNodeId(state$.value),
      visitedNodes: MindmapSelectors.selectVisitedNodes(state$.value),
    })),
    switchMap(({ conversation, payload, focusNodeId, visitedNodes }) => {
      if (!conversation || !conversation.messages[payload.messageIndex]) {
        return EMPTY;
      }

      const attachment = payload.values.custom_content?.attachments?.find(a => a.type === NodesMIMEType);
      const isAiGenerated =
        payload.values.custom_content?.attachments?.some(
          attachment => attachment.title === AttachmentTitle['Generated graph node'],
        ) ?? false;

      let customElements: Element<GraphElement>[] = [];
      let customNode: Node | null = null;
      const customViewElements = cloneDeep(conversation.customViewState.customElements);
      const elements = MindmapSelectors.selectGraphElements(state$.value);

      if (attachment?.data) {
        customElements = JSON.parse(attachment.data) as Element<GraphElement>[];

        customElements.forEach(el => {
          if (isEdge(el.data)) {
            if (!customViewElements.edges.some(e => e.data.id === el.data.id)) {
              customViewElements.edges.push(el as Element<Edge>);
            }
          } else {
            if (!customViewElements.nodes.some(n => n.data.id === el.data.id)) {
              const currentIcon = (el.data as Node).icon
                ? (el.data as Node).icon
                : isAiGenerated
                  ? AI_ROBOT_ICON_NAME
                  : undefined;
              const node = { ...el, data: { ...el.data, icon: currentIcon } } as Element<Node>;
              customViewElements.nodes.push(node);
            }
            customNode = el.data as Node;
          }
        });
      }

      const messages = [...conversation.messages];
      messages[payload.messageIndex] = {
        ...messages[payload.messageIndex],
        ...payload.values,
      };

      const newElements = customElements.filter(e => !elements.some(el => el.data.id === e.data.id));

      if (newElements.length === 0 && !customNode && !payload.isInitialization) {
        return concat(
          of(
            ConversationActions.updateConversation({
              values: { messages: [...messages] },
              isInitialization: payload.isInitialization,
            }),
          ),
        );
      }

      const hasNewElements =
        conversation.customViewState.customElements.nodes.length !== customViewElements.nodes.length ||
        conversation.customViewState.customElements.edges.length !== customViewElements.edges.length;

      const customViewState = {
        ...conversation.customViewState,
        customElements: customViewElements,
      };

      const isDifferentNode = Boolean(customNode) && focusNodeId !== undefined && customNode!.id !== focusNodeId;
      let filteredMessages: typeof messages = messages;
      let isFocusNodeNeedToUpdate = false;

      if (isDifferentNode) {
        isFocusNodeNeedToUpdate = true;
        customViewState.focusNodeId = customNode!.id;
        customViewState.visitedNodeIds = adjustVisitedNodes(
          cloneDeep(conversation.customViewState.visitedNodeIds),
          focusNodeId,
        );
        customViewState.customElements.edges = customViewState.customElements.edges.filter(
          edge => !edge.data.id.includes(focusNodeId),
        );

        const wasVisited = Boolean(visitedNodes[customNode!.id]);
        if (wasVisited) {
          filteredMessages = messages.filter(m => !m.id || !m.id.includes(focusNodeId));
        } else {
          filteredMessages = [...messages];
        }
      } else {
        filteredMessages = [...messages];
      }

      const actions: Observable<UnknownAction>[] = [];

      actions.push(
        of(
          ConversationActions.updateConversation({
            values: { messages: filteredMessages, customViewState },
            isInitialization: payload.isInitialization,
          }),
        ),
      );

      if (hasNewElements || isFocusNodeNeedToUpdate) {
        actions.push(of(MindmapActions.fetchGraph(customViewState)));
      }

      const previousNodeId = visitedNodes[focusNodeId];
      if (
        customNode &&
        previousNodeId !== (customNode as Node).id &&
        !customViewState.visitedNodeIds[(customNode as Node).id]
      ) {
        customViewState.visitedNodeIds[(customNode as Node).id] = previousNodeId;
      }

      if (isFocusNodeNeedToUpdate) {
        actions.push(of(MindmapActions.setFocusNodeId(customNode!.id)));
        actions.push(
          of(
            MindmapActions.setVisitedNodes({
              ...customViewState.visitedNodeIds,
            }),
          ),
        );
      }

      return concat(...actions);
    }),
  );

const sendMessagesEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ConversationActions.sendMessages.match),
    switchMap(({ payload }) => {
      return concat(
        of(ConversationActions.createAbortController()),
        of(
          ConversationActions.sendMessage({
            message: payload.message,
            deleteCount: payload.deleteCount,
            customFields: payload.customFields,
            captchaToken: payload.captchaToken,
          }),
        ),
      );
    }),
  );

const sendMessageEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.sendMessage.match),
    map(({ payload }) => ({
      payload,
      conversation: ConversationSelectors.selectConversation(state$.value),
    })),
    map(({ payload, conversation }) => {
      const messageModel: Message[EntityType.Model] = {
        id: conversation.model.id,
      };
      const messageSettings: Message['settings'] = {
        prompt: conversation.prompt,
        temperature: conversation.temperature,
      };

      const assistantMessage: Message = {
        id: getFocusNodeResponseId(payload.message.id!),
        content: '',
        model: messageModel,
        settings: messageSettings,
        role: Role.Assistant,
      };

      const userMessage: Message = {
        ...payload.message,
        model: messageModel,
        settings: messageSettings,
      };

      const currentMessages =
        payload.deleteCount && payload.deleteCount > 0
          ? conversation.messages.slice(0, payload.deleteCount * -1 || undefined)
          : conversation.messages;

      const updatedMessages = currentMessages.concat(userMessage, assistantMessage);

      const updatedConversation: Conversation = {
        ...conversation,
        lastActivityDate: Date.now(),
        messages: updatedMessages,
        isMessageStreaming: true,
      };

      return {
        updatedConversation,
        assistantMessage,
        customFields: payload.customFields,
        captchaToken: payload.captchaToken,
      };
    }),
    switchMap(({ updatedConversation, assistantMessage, customFields, captchaToken }) => {
      return concat(
        of(
          ConversationActions.updateConversation({
            values: updatedConversation,
          }),
        ),
        of(
          ConversationActions.streamMessage({
            conversation: updatedConversation,
            message: assistantMessage,
            customFields,
            captchaToken,
          }),
        ),
      );
    }),
  );

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
      const { messages: newMessages, isInitialization } = payload;
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
    withLatestFrom(state$.pipe(map(selectIsAllowApiKey))),
    mergeMap(([action, isAllowApiKey]) => {
      const { payload } = action;
      const conversation = ConversationSelectors.selectConversation(state$.value);
      const bucketId = BucketSelectors.selectBucketId(state$.value);
      const applicationReference = ApplicationSelectors.selectApplication(state$.value)?.reference;
      const { values } = payload;

      const newConversation: Conversation = {
        ...conversation,
        ...values,
        lastActivityDate: Date.now(),
      };

      const isPreview = ChatUISelectors.selectIsPreview(state$.value);

      if (payload.isInitialization) {
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
            customViewState: newConversation.customViewState,
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
      return concat(
        of(ConversationActions.saveConversation(newConversation)),
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

const saveConversationEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(ConversationActions.saveConversation.match),
    filter(action => !action.payload.isMessageStreaming), // shouldn't save during streaming
    filter(action => action.payload.messages.at(-1)?.role !== Role.User),
    concatMap(({ payload: newConversation }) => {
      if (isEntityIdLocal(newConversation) || !newConversation.id) {
        return EMPTY;
      }

      return ConversationService.updateConversation(newConversation).pipe(
        map(updatedConversation => ConversationActions.saveConversationSuccess({ conversation: updatedConversation })),
        catchError(() => {
          return of(ChatUIActions.showErrorToast('An error occurred while saving the conversation.'));
        }),
      );
    }),
  );

const getConversationsEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.getConversations.match),
    withLatestFrom(state$.pipe(map(selectIsAllowApiKey))),
    withLatestFrom(state$.pipe(map(BucketSelectors.selectBucketId))),
    switchMap(([[, isAllowApiKey], bucketId]) => {
      if (!bucketId) {
        console.error('Bucket ID is missing');
        return EMPTY;
      }

      if (isAllowApiKey) {
        return of(ConversationActions.getConversationsSuccess({ conversations: [] }));
      }

      return ConversationService.getConversations(`conversations/${bucketId}`, true).pipe(
        switchMap(conversations => of(ConversationActions.getConversationsSuccess({ conversations }))),
        catchError(() => {
          console.error('Conversations fetching failed');
          return EMPTY;
        }),
      );
    }),
  );

const resetConversationEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.resetConversation.match),
    withLatestFrom(state$.pipe(map(ConversationSelectors.selectConversation))),
    switchMap(([, conversation]) => {
      return of(
        ConversationActions.updateConversation({
          values: {
            messages: [conversation.messages[0], conversation.messages[1]],
            customViewState: ConversationInitialState.conversation.customViewState,
          },
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
