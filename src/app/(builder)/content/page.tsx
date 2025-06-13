'use client';

import { useCallback } from 'react';

import Loader from '@/components/builder/common/Loader';
import { GraphEditor } from '@/components/builder/editors/graph/GraphEditor';
import { MainToolbar } from '@/components/builder/toolbar/MainToolbar';
import { AuthProviderError } from '@/components/common/AuthProviderError';
import { Login } from '@/components/common/Login';
import { useBuilderInitialization } from '@/hooks/builder/content/useBuilderInitialization';
import { useEditorHotkeys } from '@/hooks/builder/content/useEditorHotkeys';
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
  const application = useBuilderSelector(ApplicationSelectors.selectApplication);
  const dispatch = useBuilderDispatch();
  const isGraphLoading = useBuilderSelector(BuilderSelectors.selectIsGraphLoading);
  const isAllowApiKeyAuth = useBuilderSelector(UISelectors.selectIsAllowApiKey);
  const isGraphReady = useBuilderSelector(GraphSelectors.selectIsReady);

  const providers = useBuilderSelector(UISelectors.selectProviders);

  const { isAllowProvider, chatAuthProvider } = useChatAuthProvider({
    isAllowApiKeyAuth: isAllowApiKeyAuth,
    providers: providers,
  });

  const resetRedirect = useCallback(() => dispatch(AuthActions.resetRedirect()), [dispatch]);

  const { session, setShouldLogin, shouldLogin } = useAuth(redirectToSignIn, resetRedirect, isAllowApiKeyAuth);

  useBuilderInitialization(dialHost, mindmapIframeTitle);
  useEditorHotkeys();

  if (!isAllowProvider) {
    return <AuthProviderError provider={chatAuthProvider ?? ''} availableProviders={providers} />;
  }

  if ((!session || !isClientSessionValid(session) || redirectToSignIn) && !isAllowApiKeyAuth)
    return (
      <Login
        onClick={() => {
          setShouldLogin(true);
        }}
        shouldLogin={shouldLogin}
      />
    );

  if (!application) {
    return null;
  }

  return (
    <>
      <MainToolbar />
      {isGraphLoading && !isGraphReady ? <Loader /> : <GraphEditor />}
    </>
  );
};

export default ContentPage;
