'use client';

import { Provider } from 'react-redux';

import { createBuilderStore } from '@/store/builder';
import { AuthUiMode } from '@/types/auth';
import { ThemesConfigs } from '@/types/themes';
import { BrowserStorage } from '@/utils/app/browser-storage';

export const BuilderStoreProvider = ({
  children,
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
}: Readonly<{
  children: React.ReactNode;
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
}>) => {
  const store = createBuilderStore({
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
  });
  BrowserStorage.init();

  return <Provider store={store}>{children}</Provider>;
};
