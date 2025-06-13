import { ChatVisualizerConnector } from '@epam/ai-dial-chat-visualizer-connector';
import { useEffect, useRef } from 'react';

import { useBuilderDispatch } from '@/store/builder/hooks';
import { PreferencesActions, PreferencesState } from '@/store/builder/preferences/preferences.reducers';
import { UIActions, UIInitialState, UIStoredState } from '@/store/builder/ui/ui.reducers';
import { StorageKeys } from '@/types/storage';
import { BrowserStorage } from '@/utils/app/browser-storage';

export const useBuilderInitialization = (dialHost: string | null, mindmapIframeTitle: string | null) => {
  const dispatch = useBuilderDispatch();
  const isInitialized = useRef(false);
  const chatVisualizerConnector = useRef<ChatVisualizerConnector | null>(null);

  useEffect(() => {
    const preferencesState = BrowserStorage.getData<PreferencesState>(StorageKeys.Preferences);
    if (preferencesState) {
      dispatch(PreferencesActions.init(preferencesState));
    }

    const uiStoredState = BrowserStorage.getData<UIStoredState>(StorageKeys.UI);
    if (uiStoredState) {
      dispatch(UIActions.init({ ...UIInitialState, ...uiStoredState }));
    }

    if (!isInitialized.current && dialHost && mindmapIframeTitle) {
      chatVisualizerConnector.current = new ChatVisualizerConnector(dialHost, mindmapIframeTitle, () => {});
      chatVisualizerConnector.current.sendReady();
      chatVisualizerConnector.current.sendReadyToInteract();
      isInitialized.current = true;
    }
  }, [dialHost, mindmapIframeTitle, dispatch]);
};
