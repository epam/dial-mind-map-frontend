'use client';

import { useCallback } from 'react';

import { AppearanceEditor } from '@/components/builder/editors/appearance/AppearanceEditor';
import { MainToolbar } from '@/components/builder/toolbar/MainToolbar';
import { AuthProviderError } from '@/components/common/AuthProviderError';
import { Forbidden } from '@/components/common/Forbidden';
import Loader from '@/components/common/Loader';
import { Login } from '@/components/common/Login';
import { NetworkOfflineBanner } from '@/components/common/NetworkOfflineBanner';
import { useBuilderInitialization } from '@/hooks/builder/content/useBuilderInitialization';
import { useApplicationInitializer } from '@/hooks/builder/sources/useApplicationInitializer';
import { useAuth } from '@/hooks/useAuth';
import { useChatAuthProvider } from '@/hooks/useChatAuthProvider';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { AuthActions, AuthSelectors } from '@/store/builder/auth/auth.slice';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { isClientSessionValid } from '@/utils/auth/session';

const CustomizePage = () => {
  const dialHost = useBuilderSelector(UISelectors.selectDialChatHost);
  const mindmapIframeTitle = useBuilderSelector(UISelectors.selectMindmapIframeTitle);
  const redirectToSignIn = useBuilderSelector(AuthSelectors.selectRedirectToSignin);
  const redirectToForbidden = useBuilderSelector(AuthSelectors.selectRedirectToForbidden);

  const application = useBuilderSelector(ApplicationSelectors.selectApplication);
  const dispatch = useBuilderDispatch();
  const isAllowApiKeyAuth = useBuilderSelector(UISelectors.selectIsAllowApiKey);
  const isApplicationReady = useBuilderSelector(ApplicationSelectors.selectIsApplicationReady);
  const authUiMode = useBuilderSelector(UISelectors.selectAuthUiMode);

  const providers = useBuilderSelector(UISelectors.selectProviders);

  useApplicationInitializer();

  const { isAllowProvider, chatAuthProvider } = useChatAuthProvider({
    isAllowApiKeyAuth: isAllowApiKeyAuth,
    providers: providers,
  });

  const resetRedirect = useCallback(() => dispatch(AuthActions.resetRedirect()), [dispatch]);

  const { session, onLogin, shouldLogin } = useAuth(
    redirectToSignIn,
    resetRedirect,
    isAllowApiKeyAuth,
    authUiMode,
    isAllowProvider,
  );

  const isOffline = useBuilderSelector(UISelectors.selectIsOffline);

  useBuilderInitialization(dialHost, mindmapIframeTitle);

  if (!isAllowProvider) {
    return <AuthProviderError provider={chatAuthProvider ?? ''} availableProviders={providers} />;
  }

  if (redirectToForbidden) {
    return <Forbidden />;
  }

  if ((!session || !isClientSessionValid(session) || redirectToSignIn) && !isAllowApiKeyAuth)
    return <Login onClick={onLogin} shouldLogin={shouldLogin} />;

  if (!application) {
    return null;
  }

  if (!isApplicationReady) {
    return <Loader containerClassName="absolute inset-0 z-10 flex size-full items-center justify-center bg-layer-2" />;
  }

  if (isOffline) {
    return <NetworkOfflineBanner />;
  }

  return (
    <>
      <MainToolbar />
      <AppearanceEditor />
    </>
  );
};

export default CustomizePage;
