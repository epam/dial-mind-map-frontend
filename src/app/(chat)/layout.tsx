import '../globals.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import classNames from 'classnames';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';

import { ChatStoreProvider } from '@/components/chat/store/StoreProvider';
import SessionProvider from '@/components/common/auth/SessionProvider';
import { CustomFontLoader } from '@/components/common/CustomFontLoader';
import { PersistentFontPreloader } from '@/components/common/PersistentFontPreloader/PersistentFontPreloader';
import { Toasts } from '@/components/common/Toasts';
import { CustomStylesTagId } from '@/constants/app';
import { montserrat } from '@/fonts/fonts';
import { AuthUiMode } from '@/types/auth';
import { handleAnonymSession } from '@/utils/app/anonymSession';
import { getFontUrl } from '@/utils/app/fonts';
import { getChatAppCookie } from '@/utils/app/getChatAppCookie';
import { nextauthOptions } from '@/utils/auth/auth-callbacks';
import { themeConfigToStyles } from '@/utils/common/themeUtils';
import { fetchApplication } from '@/utils/server/fetchApplication';
import { fetchThemeConfig } from '@/utils/server/fetchThemeConfig';

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
  const availableProviders = nextauthOptions.providers;
  const dialChatHost = process.env.DIAL_CHAT_HOST || '';
  const mindmapIframeTitle = process.env.MINDMAP_IFRAME_TITLE || '';
  const isAllowApiKeyAuth = process.env.ALLOW_API_KEY_AUTH || false;
  const chatDisclaimer = process.env.CHAT_DISCLAIMER;
  const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || '';
  const anonymSessionSecretKey = process.env.ANONYM_SESSION_SECRET_KEY || '';
  const authUiMode =
    (headers().get('x-auth-mode') as AuthUiMode) || (process.env.AUTH_UI_MODE as AuthUiMode) || AuthUiMode.Popup;

  const isPlayback = headers().get('x-playback') === 'true';

  let isRecaptchaRequired = false;
  let anonymCsrfToken = '';
  if (isAllowApiKeyAuth) {
    const settings = await handleAnonymSession(anonymSessionSecretKey);
    isRecaptchaRequired = settings.isRecaptchaRequired;
    anonymCsrfToken = settings.anonymCsrfToken;
  }

  const appCookie = getChatAppCookie();

  const { application, error: appFetchError } = await fetchApplication(appCookie.id);

  //TO-DO: dirty hack need to be refactored
  const validApplication = application && 'reference' in application ? application : undefined;
  let themeConfig = null;
  let etag = null;
  if (validApplication) {
    const [themeConfigRes, etagRes] = await fetchThemeConfig(appCookie.theme, validApplication);
    themeConfig = themeConfigRes;
    etag = etagRes;
  }

  const customStyles = themeConfigToStyles(appCookie.theme, themeConfig);
  const fontFamily = themeConfig?.font?.['font-family'] ?? '';
  const fontFileName = themeConfig?.font?.fontFileName;
  const fontUrl = getFontUrl(
    fontFamily,
    fontFileName,
    validApplication?.name ?? '',
    appCookie.theme,
    validApplication?.application_properties?.mindmap_folder ?? '',
  );

  const graphFontFamily = themeConfig?.graph?.font?.['font-family'] ?? '';
  const graphFontFileName = themeConfig?.graph?.font?.fontFileName;
  const graphFontUrl = getFontUrl(
    graphFontFamily,
    graphFontFileName,
    validApplication?.name ?? '',
    appCookie.theme,
    validApplication?.application_properties?.mindmap_folder ?? '',
  );

  return (
    <html lang="en" className={appCookie.theme} data-color-mode={appCookie.theme}>
      <head>
        {customStyles && validApplication && (
          <style id={CustomStylesTagId} dangerouslySetInnerHTML={{ __html: customStyles }} />
        )}
        {fontUrl && <link rel="stylesheet" href={fontUrl} />}
        {graphFontUrl && <link rel="stylesheet" href={graphFontUrl} />}
        {!!process.env.THEMES_CONFIG_HOST && !validApplication && <link rel="stylesheet" href={'api/themes/styles'} />}
      </head>
      <body className={classNames([montserrat.variable, 'font', 'font-theme', 'h-full'])}>
        {fontFileName && fontUrl && <CustomFontLoader fontFamily={fontFamily} fontUrl={fontUrl} />}
        {graphFontFileName && graphFontUrl && <CustomFontLoader fontFamily={graphFontFamily} fontUrl={graphFontUrl} />}
        <PersistentFontPreloader fontFamily={graphFontFamily || fontFamily} weight={400} />
        <SessionProvider refetchOnWindowFocus session={session} refetchWhenOffline={false}>
          <ChatStoreProvider
            dialChatHost={dialChatHost}
            mindmapIframeTitle={mindmapIframeTitle}
            isAllowApiKeyAuth={isAllowApiKeyAuth === 'true' || false}
            recaptchaSiteKey={recaptchaSiteKey}
            isRecaptchaRequired={isRecaptchaRequired}
            anonymCsrfToken={anonymCsrfToken}
            chatDisclaimer={chatDisclaimer}
            providers={availableProviders ? Object.values(availableProviders).map(provider => provider.id) : []}
            themeConfig={themeConfig ?? undefined}
            etag={etag}
            application={validApplication ? validApplication : null}
            redirectToSignIn={appFetchError?.status === 401}
            redirectToForbidden={appFetchError?.status === 403}
            authUiMode={authUiMode}
            isPlayback={isPlayback}
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
