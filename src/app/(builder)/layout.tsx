import '../globals.css';

import classNames from 'classnames';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { getProviders } from 'next-auth/react';

import { NavigationHandler } from '@/components/builder/NavigationHandler';
import { BuilderStoreProvider } from '@/components/builder/store/StoreProvider';
import SessionProvider from '@/components/common/auth/SessionProvider';
import { Toasts } from '@/components/common/Toasts';

import { inter } from '../../fonts/fonts';

export const metadata: Metadata = {
  title: 'Builder',
  description: 'Mindmap Builder',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  const providers = await getProviders();
  const dialApiHost = process.env.DIAL_API_HOST || '';
  const dialChatHost = process.env.DIAL_CHAT_HOST || '';
  const mindmapIframeTitle = process.env.MINDMAP_IFRAME_TITLE || '';
  const isAllowApiKeyAuth = process.env.ALLOW_API_KEY_AUTH || false;

  return (
    <html lang="en" className="dark" data-color-mode="dark">
      <head>{!!process.env.THEMES_CONFIG_HOST && <link rel="stylesheet" href={'api/themes/styles'} />}</head>
      <body className={classNames([inter.variable, 'font', 'h-full'])}>
        <SessionProvider refetchWhenOffline={false} session={session}>
          <BuilderStoreProvider
            dialApiHost={dialApiHost}
            dialChatHost={dialChatHost}
            mindmapIframeTitle={mindmapIframeTitle}
            isAllowApiKeyAuth={isAllowApiKeyAuth}
            providers={providers ? Object.values(providers).map(provider => provider.id) : []}
          >
            <Toasts />
            <NavigationHandler />
            <main className="h-screen w-screen flex-col bg-layer-1 text-sm text-primary">
              <div className="flex size-full flex-col sm:pt-0">
                <div className="relative flex size-full flex-col">{children}</div>
              </div>
            </main>
          </BuilderStoreProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
