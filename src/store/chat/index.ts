import { configureStore, Store } from '@reduxjs/toolkit';
import { combineEpics, createEpicMiddleware, Epic, EpicMiddleware } from 'redux-observable';

import AnonymSessionSlice from './anonymSession/anonymSession.slice';
import { ApplicationEpics } from './application/application.epics';
import { applicationSlice } from './application/application.reducer';
import { BucketEpics } from './bucket/bucket.epics';
import { bucketSlice } from './bucket/bucket.reducer';
import ChatAuthSlice from './chatAuth/chatAuth.slice';
import { ConversationEpics } from './conversation/conversation.epics';
import { conversationSlice } from './conversation/conversation.reducers';
import { MindmapEpics } from './mindmap/mindmap.epics';
import { mindmapSlice } from './mindmap/mindmap.reducers';
import { ReferenceEpics } from './reference/reference.epic';
import { referenceSlice } from './reference/reference.reducers';
import { ChatUIEpics } from './ui/ui.epics';
import { chatUISlice } from './ui/ui.reducers';

export const rootEpic = combineEpics(
  MindmapEpics,
  ConversationEpics,
  BucketEpics,
  ApplicationEpics,
  ChatUIEpics,
  ReferenceEpics,
);

const reducer = {
  mindmap: mindmapSlice.reducer,
  conversation: conversationSlice.reducer,
  chatUI: chatUISlice.reducer,
  bucket: bucketSlice.reducer,
  application: applicationSlice.reducer,
  chatAuth: ChatAuthSlice,
  anonymSession: AnonymSessionSlice,
  reference: referenceSlice.reducer,
};

let store: Store;
export type ChatAppStore = ReturnType<typeof createChatStore>;
export type ChatRootState = ReturnType<typeof store.getState>;
export type ChatAppDispatch = typeof store.dispatch;

const getMiddleware = (epicMiddleware: EpicMiddleware<unknown, unknown, void, any>) => {
  return (getDefaultMiddleware: any) => {
    return getDefaultMiddleware({
      thunk: false,
      serializableCheck: false,
    }).concat(epicMiddleware);
  };
};

export const createChatStore = ({
  dialChatHost,
  mindmapIframeTitle,
  isAllowApiKeyAuth,
  recaptchaSiteKey,
  isRecaptchaRequired,
  anonymCsrfToken,
  chatDisclaimer,
  providers,
}: {
  dialChatHost: string;
  mindmapIframeTitle: string;
  isAllowApiKeyAuth: boolean;
  recaptchaSiteKey: string;
  isRecaptchaRequired: boolean;
  anonymCsrfToken: string;
  chatDisclaimer?: string;
  providers: string[];
}) => {
  const initialState = {
    chatUI: {
      ...chatUISlice.getInitialState(),
      dialChatHost,
      mindmapIframeTitle,
      isAllowApiKeyAuth,
      chatDisclaimer,
      providers,
    },
    anonymSession: {
      recaptchaSiteKey,
      isRecaptchaRequired,
      anonymCsrfToken,
    },
  };
  if (typeof window === 'undefined') {
    const epicMiddleware = createEpicMiddleware();

    const middleware = getMiddleware(epicMiddleware);
    const localStore = configureStore({
      reducer,
      preloadedState: initialState,
      middleware,
    });
    epicMiddleware.run(rootEpic as unknown as Epic);

    return localStore;
  }

  if (!store) {
    const epicMiddleware = createEpicMiddleware();

    const middleware = getMiddleware(epicMiddleware);
    store = configureStore({
      reducer,
      preloadedState: initialState,
      middleware,
    });
    epicMiddleware.run(rootEpic as unknown as Epic);
  }

  return store;
};
