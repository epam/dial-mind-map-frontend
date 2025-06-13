import '../globals.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import classNames from 'classnames';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { getProviders } from 'next-auth/react';

import { ChatStoreProvider } from '@/components/chat/store/StoreProvider';
import SessionProvider from '@/components/common/auth/SessionProvider';
import { Toasts } from '@/components/common/Toasts';
import { handleAnonymSession } from '@/utils/app/anonymSession';

import { inter, montserrat } from '../../fonts/fonts';

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Mindmap Chat',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  const providers = await getProviders();
  const dialChatHost = process.env.DIAL_CHAT_HOST || '';
  const mindmapIframeTitle = process.env.MINDMAP_IFRAME_TITLE || '';
  const isAllowApiKeyAuth = process.env.ALLOW_API_KEY_AUTH || false;
  const chatDisclaimer = process.env.CHAT_DISCLAIMER;
  const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || '';
  const anonymSessionSecretKey = process.env.ANONYM_SESSION_SECRET_KEY || '';

  let isRecaptchaRequired = false;
  let anonymCsrfToken = '';
  if (isAllowApiKeyAuth) {
    const settings = await handleAnonymSession(anonymSessionSecretKey);
    isRecaptchaRequired = settings.isRecaptchaRequired;
    anonymCsrfToken = settings.anonymCsrfToken;
  }

  return (
    <html lang="en" className="dark" data-color-mode="dark">
      <head>{!!process.env.THEMES_CONFIG_HOST && <link rel="stylesheet" href={'api/themes/styles'} />}</head>
      <body className={classNames([inter.variable, 'font', 'h-full', montserrat.variable])}>
        <SessionProvider refetchOnWindowFocus session={session} refetchWhenOffline={false}>
          <ChatStoreProvider
            dialChatHost={dialChatHost}
            mindmapIframeTitle={mindmapIframeTitle}
            isAllowApiKeyAuth={isAllowApiKeyAuth}
            recaptchaSiteKey={recaptchaSiteKey}
            isRecaptchaRequired={isRecaptchaRequired}
            anonymCsrfToken={anonymCsrfToken}
            chatDisclaimer={chatDisclaimer}
            providers={providers ? Object.values(providers).map(provider => provider.id) : []}
          >
            <Toasts />
            <main className="h-screen w-screen flex-col overflow-hidden bg-layer-1 text-sm text-primary">
              <div className="flex size-full flex-col sm:pt-0">
                <div className="m-2 h-[calc(100%-16px)] lg:m-5 lg:h-[calc(100%-40px)]">{children}</div>
              </div>
            </main>
          </ChatStoreProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
