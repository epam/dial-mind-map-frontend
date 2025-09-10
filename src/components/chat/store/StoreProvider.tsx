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
  mindmapIframeTitle,
  isAllowApiKeyAuth,
  recaptchaSiteKey,
  isRecaptchaRequired,
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
}: Readonly<{
  children: React.ReactNode;
  dialChatHost: string;
  mindmapIframeTitle: string;
  isAllowApiKeyAuth: boolean;
  recaptchaSiteKey: string;
  isRecaptchaRequired: boolean;
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
}>) => {
  const store = createChatStore({
    dialChatHost,
    mindmapIframeTitle,
    isAllowApiKeyAuth,
    recaptchaSiteKey,
    isRecaptchaRequired,
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
  });
  BrowserStorage.init();

  return <Provider store={store}>{children}</Provider>;
};
