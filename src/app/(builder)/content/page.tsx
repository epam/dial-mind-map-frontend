'use client';

import { useCallback } from 'react';

import { GraphEditor } from '@/components/builder/editors/graph/GraphEditor';
import { MainToolbar } from '@/components/builder/toolbar/MainToolbar';
import { AuthProviderError } from '@/components/common/AuthProviderError';
import { Forbidden } from '@/components/common/Forbidden';
import Loader from '@/components/common/Loader';
import { Login } from '@/components/common/Login';
import { NetworkOfflineBanner } from '@/components/common/NetworkOfflineBanner';
import { ServerUnavailableBanner } from '@/components/common/ServerUnavailableBanner';
import { useBuilderInitialization } from '@/hooks/builder/content/useBuilderInitialization';
import { useEditorHotkeys } from '@/hooks/builder/content/useEditorHotkeys';
import { useApplicationInitializer } from '@/hooks/builder/sources/useApplicationInitializer';
import { useAuth } from '@/hooks/useAuth';
import { useChatAuthProvider } from '@/hooks/useChatAuthProvider';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { AuthActions, AuthSelectors } from '@/store/builder/auth/auth.slice';
import { BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { GraphSelectors } from '@/store/builder/graph/graph.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { isClientSessionValid } from '@/utils/auth/session';

const ContentPage = () => {
  const dialHost = useBuilderSelector(UISelectors.selectDialChatHost);
  const mindmapIframeTitle = useBuilderSelector(UISelectors.selectMindmapIframeTitle);
  const redirectToSignIn = useBuilderSelector(AuthSelectors.selectRedirectToSignin);
  const redirectToForbidden = useBuilderSelector(AuthSelectors.selectRedirectToForbidden);
  const application = useBuilderSelector(ApplicationSelectors.selectApplication);
  const dispatch = useBuilderDispatch();
  const isGraphLoading = useBuilderSelector(BuilderSelectors.selectIsGraphLoading);
  const isAllowApiKeyAuth = useBuilderSelector(UISelectors.selectIsAllowApiKey);
  const isGraphReady = useBuilderSelector(GraphSelectors.selectIsReady);
  const isApplicationReady = useBuilderSelector(ApplicationSelectors.selectIsApplicationReady);
  const authUiMode = useBuilderSelector(UISelectors.selectAuthUiMode);

  const providers = useBuilderSelector(UISelectors.selectProviders);

  const { isAllowProvider, chatAuthProvider } = useChatAuthProvider({
    isAllowApiKeyAuth: isAllowApiKeyAuth,
    providers: providers,
  });

  const resetRedirect = useCallback(() => dispatch(AuthActions.resetRedirect()), [dispatch]);

  const { session, shouldLogin, onLogin } = useAuth(
    redirectToSignIn,
    resetRedirect,
    isAllowApiKeyAuth,
    authUiMode,
    isAllowProvider,
  );

  useApplicationInitializer();

  useBuilderInitialization(dialHost, mindmapIframeTitle);
  useEditorHotkeys();

  const isOffline = useBuilderSelector(UISelectors.selectIsOffline);
  const isServerUnavailable = useBuilderSelector(UISelectors.selectIsServerUnavailable);

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

  if (isServerUnavailable) {
    return <ServerUnavailableBanner />;
  }

  if (isOffline) {
    return <NetworkOfflineBanner />;
  }

  return (
    <>
      <MainToolbar />
      {isGraphLoading && !isGraphReady ? <Loader /> : <GraphEditor />}
    </>
  );
};

export default ContentPage;
