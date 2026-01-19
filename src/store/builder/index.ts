import { configureStore, Store } from '@reduxjs/toolkit';
import { combineEpics, createEpicMiddleware, Epic, EpicMiddleware } from 'redux-observable';

import { AuthUiMode } from '@/types/auth';
import { ThemesConfigs } from '@/types/themes';

import { AppearanceEpics } from './appearance/appearance.epics';
import { appearanceSlice } from './appearance/appearance.reducers';
import { ApplicationEpics } from './application/application.epics';
import { applicationSlice } from './application/application.reducer';
import authSlice from './auth/auth.slice';
import { BuilderEpics } from './builder/builder.epics';
import { builderSlice } from './builder/builder.reducers';
import { CompletionEpics } from './completion/completion.epics';
import { completionSlice } from './completion/completion.reducers';
import { GraphEpics } from './graph/graph.epics';
import { graphSlice } from './graph/graph.reducers';
import { HistoryEpics } from './history/history.epics';
import { historySlice } from './history/history.reducers';
import { ListenerMiddleware } from './middleware/listener';
import { preferencesSlice } from './preferences/preferences.reducers';
import { settingsSlice } from './settings/settings.reducers';
import { SourcesEpics } from './sources/sources.epic';
import { sourcesSlice } from './sources/sources.reducers';
import { UIEpics } from './ui/ui.epics';
import { uiSlice } from './ui/ui.reducers';
import { uploadResourceStatusSlice } from './uploadResourceStatus/uploadResourceStatus.reducers';

export const rootEpic = combineEpics(
  BuilderEpics,
  UIEpics,
  CompletionEpics,
  ApplicationEpics,
  GraphEpics,
  HistoryEpics,
  AppearanceEpics,
  SourcesEpics,
);

const reducer = {
  builder: builderSlice.reducer,
  graph: graphSlice.reducer,
  ui: uiSlice.reducer,
  preferences: preferencesSlice.reducer,
  completion: completionSlice.reducer,
  application: applicationSlice.reducer,
  auth: authSlice,
  history: historySlice.reducer,
  appearance: appearanceSlice.reducer,
  settings: settingsSlice.reducer,
  uploadResourceStatus: uploadResourceStatusSlice.reducer,
  sources: sourcesSlice.reducer,
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
  dialIframeAllowedHosts,
  mindmapIframeTitle,
  isAllowApiKeyAuth,
  providers,
  googleFontsApiKey,
  authUiMode,
  isSimpleGenerationModeAvailable,
  defaultSimpleModeModel,
  availableSimpleModeModels,
  defaultSimpleModePrompt,
  defaultChatModel,
  availableChatModels,
  defaultChatPrompt,
  defaultChatGuardrailsPrompt,
  themesConfig,
  isProdEnv,
  generationSourcesTokensLimit,
  defaultChatGuardrailsResponsePrompt,
}: {
  dialChatHost: string;
  dialIframeAllowedHosts: string[];
  mindmapIframeTitle: string;
  isAllowApiKeyAuth: boolean;
  providers: string[];
  googleFontsApiKey: string;
  authUiMode: AuthUiMode;
  isSimpleGenerationModeAvailable: boolean;
  defaultSimpleModeModel: string;
  availableSimpleModeModels: string[];
  defaultSimpleModePrompt: string;
  defaultChatModel: string;
  availableChatModels: string[];
  defaultChatPrompt: string;
  defaultChatGuardrailsPrompt: string;
  themesConfig: ThemesConfigs | null;
  isProdEnv: boolean;
  generationSourcesTokensLimit?: number;
  defaultChatGuardrailsResponsePrompt: string;
}) => {
  const initialState = {
    ui: {
      ...uiSlice.getInitialState(),
      dialChatHost,
      mindmapIframeTitle,
      isAllowApiKeyAuth,
      providers,
      authUiMode,
      isSimpleGenerationModeAvailable,
      dialIframeAllowedHosts,
      themesConfig,
    },
    settings: {
      ...settingsSlice.getInitialState(),
      googleFontsApiKey,
      isProdEnv,
      generationSourcesTokensLimit,
    },
    builder: {
      ...builderSlice.getInitialState(),
      defaultSimpleModeModel,
      availableSimpleModeModels,
      defaultSimpleModePrompt,
      defaultChatModel,
      availableChatModels,
      defaultChatPrompt,
      defaultChatGuardrailsPrompt,
      defaultChatGuardrailsResponsePrompt,
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
