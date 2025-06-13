'use client';

import { Provider } from 'react-redux';

import { createBuilderStore } from '@/store/builder';
import { BrowserStorage } from '@/utils/app/browser-storage';

export const BuilderStoreProvider = ({
  children,
  dialChatHost,
  mindmapIframeTitle,
  dialApiHost,
  isAllowApiKeyAuth,
  providers,
}: Readonly<{
  children: React.ReactNode;
  dialChatHost: string;
  mindmapIframeTitle: string;
  dialApiHost: string;
  isAllowApiKeyAuth: boolean;
  providers: string[];
}>) => {
  const store = createBuilderStore({ dialChatHost, mindmapIframeTitle, dialApiHost, isAllowApiKeyAuth, providers });
  BrowserStorage.init();

  return <Provider store={store}>{children}</Provider>;
};
