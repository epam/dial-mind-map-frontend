import '../globals.css';

import classNames from 'classnames';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { NavigationHandler } from '@/components/builder/NavigationHandler';
import { BuilderStoreProvider } from '@/components/builder/store/StoreProvider';
import { AccessDenied } from '@/components/common/AccessDenied';
import SessionProvider from '@/components/common/auth/SessionProvider';
import { Toasts } from '@/components/common/Toasts';
import { AuthUiMode } from '@/types/auth';
import { nextauthOptions } from '@/utils/auth/auth-callbacks';

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
  const availableProviders = nextauthOptions.providers;
  const dialApiHost = process.env.DIAL_API_HOST || '';
  const dialChatHost = process.env.DIAL_CHAT_HOST || '';
  const mindmapIframeTitle = process.env.MINDMAP_IFRAME_TITLE || '';
  const isAllowApiKeyAuth = process.env.ALLOW_API_KEY_AUTH || false;
  const googleFontsApiKey = process.env.GOOGLE_FONTS_API_KEY || '';
  const authUiMode = (process.env.AUTH_UI_MODE as AuthUiMode) || AuthUiMode.Popup;
  const isSimpleGenerationModeAvailable = process.env.SIMPLE_GENERATION_MODE_AVAILABLE === 'true';
  const defaultSimpleModeModel = process.env.DEFAULT_SIMPLE_MODE_MODEL || 'gemini-2.5-pro';
  const defaultSimpleModePrompt = process.env.DEFAULT_SIMPLE_MODE_PROMPT || '';

  if (isAllowApiKeyAuth === 'true') {
    return <AccessDenied />;
  }

  return (
    <html lang="en" className="dark" data-color-mode="dark">
      <head>{!!process.env.THEMES_CONFIG_HOST && <link rel="stylesheet" href={'api/themes/styles'} />}</head>
      <body className={classNames([inter.variable, 'font', 'h-full'])}>
        <SessionProvider refetchWhenOffline={false} session={session}>
          <BuilderStoreProvider
            dialApiHost={dialApiHost}
            dialChatHost={dialChatHost}
            mindmapIframeTitle={mindmapIframeTitle}
            isAllowApiKeyAuth={isAllowApiKeyAuth === 'true' || false}
            providers={availableProviders ? Object.values(availableProviders).map(provider => provider.id) : []}
            googleFontsApiKey={googleFontsApiKey}
            authUiMode={authUiMode}
            isSimpleGenerationModeAvailable={isSimpleGenerationModeAvailable}
            defaultSimpleModeModel={defaultSimpleModeModel}
            defaultSimpleModePrompt={defaultSimpleModePrompt}
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
