'use client';

import { Provider } from 'react-redux';

import { createBuilderStore } from '@/store/builder';
import { AuthUiMode } from '@/types/auth';
import { BrowserStorage } from '@/utils/app/browser-storage';

export const BuilderStoreProvider = ({
  children,
  dialChatHost,
  mindmapIframeTitle,
  dialApiHost,
  isAllowApiKeyAuth,
  providers,
  googleFontsApiKey,
  authUiMode,
  isSimpleGenerationModeAvailable,
  defaultSimpleModeModel,
  defaultSimpleModePrompt,
}: Readonly<{
  children: React.ReactNode;
  dialChatHost: string;
  mindmapIframeTitle: string;
  dialApiHost: string;
  isAllowApiKeyAuth: boolean;
  providers: string[];
  googleFontsApiKey: string;
  authUiMode: AuthUiMode;
  isSimpleGenerationModeAvailable: boolean;
  defaultSimpleModeModel: string;
  defaultSimpleModePrompt: string;
}>) => {
  const store = createBuilderStore({
    dialChatHost,
    mindmapIframeTitle,
    dialApiHost,
    isAllowApiKeyAuth,
    providers,
    googleFontsApiKey,
    authUiMode,
    isSimpleGenerationModeAvailable,
    defaultSimpleModeModel,
    defaultSimpleModePrompt,
  });
  BrowserStorage.init();

  return <Provider store={store}>{children}</Provider>;
};
