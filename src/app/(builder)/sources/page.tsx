'use client';

import { ChatVisualizerConnector } from '@epam/ai-dial-chat-visualizer-connector';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import SourceEditor from '@/components/builder/editors/sources/SourcesEditor';
import { GeneratingErrorView } from '@/components/builder/GeneratingErrorView';
import { GeneratingLoaderView } from '@/components/builder/GeneratingLoaderView';
import { MainToolbar } from '@/components/builder/toolbar/MainToolbar';
import { AuthProviderError } from '@/components/common/AuthProviderError';
import { Forbidden } from '@/components/common/Forbidden';
import Loader from '@/components/common/Loader';
import { Login } from '@/components/common/Login';
import { NetworkOfflineBanner } from '@/components/common/NetworkOfflineBanner';
import { useApplicationInitializer } from '@/hooks/builder/sources/useApplicationInitializer';
import { useHistoryHotKeys } from '@/hooks/builder/useHistoryHotKeys';
import { useAuth } from '@/hooks/useAuth';
import { useChatAuthProvider } from '@/hooks/useChatAuthProvider';
import { useRedirecting } from '@/hooks/useRedirecting';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { AuthActions, AuthSelectors } from '@/store/builder/auth/auth.slice';
import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { SourcesSelectors } from '@/store/builder/sources/sources.selectors';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { Pages } from '@/types/common';
import { GenerationStatus } from '@/types/sources';
import { isClientSessionValid } from '@/utils/auth/session';

const SourcesPage = () => {
  const router = useRouter();

  const dispatch = useBuilderDispatch();
  const generatingStatus = useBuilderSelector(BuilderSelectors.selectGeneratingStatus);
  const generationComplete = useBuilderSelector(BuilderSelectors.selectGenerationComplete);
  const generationStatus = useBuilderSelector(BuilderSelectors.selectGenerationStatus);
  const [isRedirect] = useRedirecting(router);

  const dialHost = useBuilderSelector(UISelectors.selectDialChatHost);
  const mindmapIframeTitle = useBuilderSelector(UISelectors.selectMindmapIframeTitle);
  const isInitialized = useRef(false);
  const chatVisualizerConnector = useRef<ChatVisualizerConnector | null>(null);

  const isApplicationLoading = useBuilderSelector(ApplicationSelectors.selectApplicationLoading);
  const isSourcesLoading = useBuilderSelector(SourcesSelectors.selectIsSourcesLoading);

  const redirectToSignIn = useBuilderSelector(AuthSelectors.selectRedirectToSignin);
  const redirectToForbidden = useBuilderSelector(AuthSelectors.selectRedirectToForbidden);
  const resetRedirect = useCallback(() => dispatch(AuthActions.resetRedirect()), [dispatch]);
  const authUiMode = useBuilderSelector(UISelectors.selectAuthUiMode);

  const isAllowApiKeyAuth = useBuilderSelector(UISelectors.selectIsAllowApiKey);
  const providers = useBuilderSelector(UISelectors.selectProviders);

  const { isAllowProvider, chatAuthProvider } = useChatAuthProvider({
    isAllowApiKeyAuth: isAllowApiKeyAuth,
    providers: providers,
  });

  const { session, shouldLogin, onLogin } = useAuth(
    redirectToSignIn,
    resetRedirect,
    isAllowApiKeyAuth,
    authUiMode,
    isAllowProvider,
  );

  useApplicationInitializer();

  useHistoryHotKeys();

  useEffect(() => {
    if (!isInitialized.current) {
      if (!chatVisualizerConnector.current && dialHost && mindmapIframeTitle) {
        chatVisualizerConnector.current = new ChatVisualizerConnector(dialHost, mindmapIframeTitle, () => {});
      }

      if (dialHost && mindmapIframeTitle) {
        chatVisualizerConnector.current?.sendReady();
        chatVisualizerConnector.current?.sendReadyToInteract();
      }
      isInitialized.current = true;
    }
  }, [isInitialized, dialHost, mindmapIframeTitle]);

  const isOffline = useBuilderSelector(UISelectors.selectIsOffline);

  useEffect(() => {
    if (generationComplete) {
      router.push(`/${Pages.CONTENT}?${new URLSearchParams(window.location.search).toString()}`);
      dispatch(BuilderActions.resetGenerationComplete());
    }
  }, [generationComplete, dispatch, router]);

  if (!isAllowProvider) {
    return <AuthProviderError provider={chatAuthProvider ?? ''} availableProviders={providers} />;
  }

  if (redirectToForbidden) {
    return <Forbidden />;
  }

  if ((!session || !isClientSessionValid(session) || redirectToSignIn) && !isAllowApiKeyAuth) {
    return <Login onClick={onLogin} shouldLogin={shouldLogin} />;
  }

  const getContent = () => {
    if (generatingStatus.isError)
      return <GeneratingErrorView title={generatingStatus.title} message={generatingStatus.details} />;
    if (generationStatus === GenerationStatus.IN_PROGRESS) return <GeneratingLoaderView />;
    if (isRedirect || isApplicationLoading || isSourcesLoading) return <Loader />;
    if (generationStatus === GenerationStatus.NOT_STARTED || generationStatus === GenerationStatus.FINISHED) {
      return <SourceEditor />;
    }
    if (isOffline) {
      return <NetworkOfflineBanner />;
    }
    return null;
  };

  const content = getContent();
  const shouldHaveToolbar = content && content.type === SourceEditor;

  return (
    <>
      {shouldHaveToolbar && <MainToolbar />}
      <div
        className={classNames('w-[calc(100%-24px)] h-[calc(100%-8px)]', shouldHaveToolbar && '!h-[calc(100%-82px)]')}
      >
        {getContent()}
      </div>
    </>
  );
};

export default SourcesPage;
