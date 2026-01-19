'use client';

import { Provider } from 'react-redux';

import { createChatStore } from '@/store/chat';
import { Application } from '@/types/application';
import { AuthUiMode } from '@/types/auth';
import { ThemeConfig } from '@/types/customization';
import { BrowserStorage } from '@/utils/app/browser-storage';

export const ChatStoreProvider = ({
  children,
  dialChatHost,
  dialIframeAllowedHosts,
  mindmapIframeTitle,
  isAllowApiKeyAuth,
  recaptchaSiteKey,
  isRecaptchaRequired,
  isRecaptchaConfigured,
  anonymCsrfToken,
  chatDisclaimer,
  providers,
  themeConfig,
  etag,
  application,
  redirectToSignIn = false,
  redirectToForbidden = false,
  authUiMode,
  isPlayback = false,
  isProdEnv,
  theme,
}: Readonly<{
  children: React.ReactNode;
  dialChatHost: string;
  dialIframeAllowedHosts: string[];
  mindmapIframeTitle: string;
  isAllowApiKeyAuth: boolean;
  recaptchaSiteKey: string;
  isRecaptchaRequired: boolean;
  isRecaptchaConfigured: boolean;
  anonymCsrfToken: string;
  chatDisclaimer?: string;
  providers: string[];
  themeConfig?: ThemeConfig;
  etag: string | null;
  application?: Application | null;
  redirectToSignIn?: boolean;
  redirectToForbidden?: boolean;
  authUiMode: AuthUiMode;
  isPlayback?: boolean;
  isProdEnv: boolean;
  theme?: string;
}>) => {
  const store = createChatStore({
    dialChatHost,
    dialIframeAllowedHosts,
    mindmapIframeTitle,
    isAllowApiKeyAuth,
    recaptchaSiteKey,
    isRecaptchaRequired,
    isRecaptchaConfigured,
    anonymCsrfToken,
    chatDisclaimer,
    providers,
    themeConfig,
    etag: etag,
    redirectToSignIn,
    redirectToForbidden,
    application: { application: application },
    authUiMode,
    isPlayback,
    isProdEnv,
    theme,
  });
  BrowserStorage.init();

  return <Provider store={store}>{children}</Provider>;
};
