import '../globals.css';

import classNames from 'classnames';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { NavigationHandler } from '@/components/builder/NavigationHandler';
import { BuilderStoreProvider } from '@/components/builder/store/StoreProvider';
import { AccessDenied } from '@/components/common/AccessDenied';
import SessionProvider from '@/components/common/auth/SessionProvider';
import { Toasts } from '@/components/common/Toasts';
import {
  DEFAULT_CHAT_GUARDRAILS_PROMPT,
  DEFAULT_CHAT_GUARDRAILS_RESPONSE_PROMPT,
  DEFAULT_CHAT_PROMPT,
  DEFAULT_LITE_MODE_PROMPT,
  DEFAULT_LITE_MODE_TOKENS_LIMIT,
} from '@/constants/app';
import { AuthUiMode } from '@/types/auth';
import { nextauthOptions } from '@/utils/auth/auth-callbacks';
import { splitAndFilter } from '@/utils/common/list';
import { mapDialThemeConfigToStyles } from '@/utils/common/themeUtils';
import { fetchDialThemeConfig } from '@/utils/server/fetchThemeConfig';

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
  const dialChatHost = process.env.DIAL_CHAT_HOST || '';
  const dialIframeAllowedHosts = process.env.DIAL_IFRAME_ALLOWED_HOSTS || '';
  const mindmapIframeTitle = process.env.MINDMAP_IFRAME_TITLE || '';
  const isAllowApiKeyAuth = !!process.env.DIAL_API_KEY || false;
  const isBuilderApiKeyAuth = process.env.BUILDER_ALLOW_API_KEY_AUTH || false;
  const googleFontsApiKey = process.env.GOOGLE_FONTS_API_KEY || '';
  const authUiMode = (process.env.AUTH_UI_MODE as AuthUiMode) || AuthUiMode.Popup;
  const isSimpleGenerationModeAvailable = !(process.env.LITE_MODE_AVAILABLE === 'false');
  const defaultSimpleModeModel = process.env.DEFAULT_LITE_MODE_MODEL || '';
  const availableSimpleModeModels = splitAndFilter(process.env.AVAILABLE_LITE_MODE_MODELS ?? '');
  const defaultSimpleModePrompt = process.env.DEFAULT_LITE_MODE_PROMPT || DEFAULT_LITE_MODE_PROMPT;
  const defaultChatModel = process.env.DEFAULT_CHAT_MODEL || '';
  const availableChatModels = splitAndFilter(process.env.AVAILABLE_CHAT_MODELS ?? '');
  const defaultChatPrompt = process.env.DEFAULT_CHAT_PROMPT || DEFAULT_CHAT_PROMPT;
  const defaultChatGuardrailsPrompt = process.env.DEFAULT_CHAT_GUARDRAILS_PROMPT || DEFAULT_CHAT_GUARDRAILS_PROMPT;
  const defaultChatGuardrailsResponsePrompt =
    process.env.DEFAULT_CHAT_GUARDRAILS_RESPONSE_PROMPT || DEFAULT_CHAT_GUARDRAILS_RESPONSE_PROMPT;

  const isProdEnv = process.env.NODE_ENV === 'production';
  const generationSourcesTokensLimit = process.env.LITE_MODE_TOKENS_LIMIT
    ? parseInt(process.env.LITE_MODE_TOKENS_LIMIT, 10)
    : DEFAULT_LITE_MODE_TOKENS_LIMIT;

  if (isAllowApiKeyAuth && isBuilderApiKeyAuth !== 'true') {
    return <AccessDenied />;
  }

  const themeConfig = await fetchDialThemeConfig();
  const themeStyles = themeConfig ? mapDialThemeConfigToStyles(themeConfig) : null;

  return (
    <html lang="en" className="dark" data-color-mode="dark">
      <head>
        {!!process.env.THEMES_CONFIG_HOST &&
          (themeStyles ? (
            <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
          ) : (
            <link rel="stylesheet" href={'api/themes/styles'} />
          ))}
      </head>
      <body className={classNames([inter.variable, 'font', 'h-full'])}>
        <SessionProvider refetchWhenOffline={false} session={session}>
          <BuilderStoreProvider
            dialChatHost={dialChatHost}
            dialIframeAllowedHosts={splitAndFilter(dialIframeAllowedHosts)}
            mindmapIframeTitle={mindmapIframeTitle}
            isAllowApiKeyAuth={isBuilderApiKeyAuth === 'true' || false}
            providers={availableProviders ? Object.values(availableProviders).map(provider => provider.id) : []}
            googleFontsApiKey={googleFontsApiKey}
            authUiMode={authUiMode}
            isSimpleGenerationModeAvailable={isSimpleGenerationModeAvailable}
            defaultSimpleModeModel={defaultSimpleModeModel}
            availableSimpleModeModels={availableSimpleModeModels}
            defaultSimpleModePrompt={defaultSimpleModePrompt}
            defaultChatModel={defaultChatModel}
            availableChatModels={availableChatModels}
            defaultChatPrompt={defaultChatPrompt}
            defaultChatGuardrailsPrompt={defaultChatGuardrailsPrompt}
            themesConfig={themeConfig}
            isProdEnv={isProdEnv}
            generationSourcesTokensLimit={generationSourcesTokensLimit}
            defaultChatGuardrailsResponsePrompt={defaultChatGuardrailsResponsePrompt}
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
