import { configureStore, Store } from '@reduxjs/toolkit';
import { combineEpics, createEpicMiddleware, Epic, EpicMiddleware } from 'redux-observable';

import { ApplicationEpics } from './application/application.epics';
import { applicationSlice } from './application/application.reducer';
import authSlice from './auth/auth.slice';
import { BuilderEpics } from './builder/builder.epics';
import { builderSlice } from './builder/builder.reducers';
import { CompletionEpics } from './completion/completion.epics';
import { completionSlice } from './completion/completion.reducers';
import { FilesEpics } from './files/files.epics';
import { filesSlice } from './files/files.reducers';
import { GraphEpics } from './graph/graph.epics';
import { graphSlice } from './graph/graph.reducers';
import { HistoryEpics } from './history/history.epics';
import { historySlice } from './history/history.reducers';
import { ListenerMiddleware } from './middleware/listener';
import { preferencesSlice } from './preferences/preferences.reducers';
import { UIEpics } from './ui/ui.epics';
import { uiSlice } from './ui/ui.reducers';

export const rootEpic = combineEpics(
  BuilderEpics,
  UIEpics,
  CompletionEpics,
  ApplicationEpics,
  FilesEpics,
  GraphEpics,
  HistoryEpics,
);

const reducer = {
  builder: builderSlice.reducer,
  graph: graphSlice.reducer,
  ui: uiSlice.reducer,
  preferences: preferencesSlice.reducer,
  completion: completionSlice.reducer,
  application: applicationSlice.reducer,
  auth: authSlice,
  files: filesSlice.reducer,
  history: historySlice.reducer,
};

let store: Store;
export type BuilderAppStore = ReturnType<typeof createBuilderStore>;
export type BuilderRootState = ReturnType<typeof store.getState>;
export type BuilderAppDispatch = typeof store.dispatch;

const getMiddleware = (epicMiddleware: EpicMiddleware<unknown, unknown, void, any>) => {
  return (getDefaultMiddleware: any) => {
    return getDefaultMiddleware({
      thunk: false,
      serializableCheck: false,
    })
      .concat(epicMiddleware)
      .concat(ListenerMiddleware.middleware);
  };
};

export const createBuilderStore = ({
  dialChatHost,
  mindmapIframeTitle,
  dialApiHost,
  isAllowApiKeyAuth,
  providers,
}: {
  dialApiHost: string;
  dialChatHost: string;
  mindmapIframeTitle: string;
  isAllowApiKeyAuth: boolean;
  providers: string[];
}) => {
  const initialState = {
    ui: {
      ...uiSlice.getInitialState(),
      dialChatHost,
      mindmapIframeTitle,
      isAllowApiKeyAuth,
      providers,
    },
    files: {
      ...filesSlice.getInitialState(),
      dialApiHost,
    },
  };
  if (typeof window === 'undefined') {
    const epicMiddleware = createEpicMiddleware();

    const middleware = getMiddleware(epicMiddleware);
    const localStore = configureStore({
      reducer,
      middleware,
      preloadedState: initialState,
    });
    epicMiddleware.run(rootEpic as unknown as Epic);

    return localStore;
  }

  if (!store) {
    const epicMiddleware = createEpicMiddleware();

    const middleware = getMiddleware(epicMiddleware);
    store = configureStore({
      reducer,
      middleware,
      preloadedState: initialState,
    });
    epicMiddleware.run(rootEpic as unknown as Epic);
  }

  return store;
};
