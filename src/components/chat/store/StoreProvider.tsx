'use client';

import { Provider } from 'react-redux';

import { createChatStore } from '@/store/chat';
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
  });
  BrowserStorage.init();

  return <Provider store={store}>{children}</Provider>;
};
