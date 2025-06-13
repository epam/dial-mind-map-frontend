'use client';

import { ChatVisualizerConnector } from '@epam/ai-dial-chat-visualizer-connector';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import Loader from '@/components/builder/common/Loader';
import SourceEditor from '@/components/builder/editors/sources/SourcesEditor';
import { GeneratingErrorView } from '@/components/builder/GeneratingErrorView';
import { GeneratingLoaderView } from '@/components/builder/GeneratingLoaderView';
import { MainToolbar } from '@/components/builder/toolbar/MainToolbar';
import { AuthProviderError } from '@/components/common/AuthProviderError';
import { Login } from '@/components/common/Login';
import { useSourcesInitializer } from '@/hooks/builder/sources/useSourcesInitializer';
import { useHistoryHotKeys } from '@/hooks/builder/useHistoryHotKeys';
import { useAuth } from '@/hooks/useAuth';
import { useChatAuthProvider } from '@/hooks/useChatAuthProvider';
import { useRedirecting } from '@/hooks/useRedirecting';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { AuthActions, AuthSelectors } from '@/store/builder/auth/auth.slice';
import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
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
  const isSourcesLoading = useBuilderSelector(BuilderSelectors.selectIsSourcesLoading);

  const redirectToSignIn = useBuilderSelector(AuthSelectors.selectRedirectToSignin);
  const resetRedirect = useCallback(() => dispatch(AuthActions.resetRedirect()), [dispatch]);

  const isAllowApiKeyAuth = useBuilderSelector(UISelectors.selectIsAllowApiKey);
  const providers = useBuilderSelector(UISelectors.selectProviders);

  const { isAllowProvider, chatAuthProvider } = useChatAuthProvider({
    isAllowApiKeyAuth: isAllowApiKeyAuth,
    providers: providers,
  });

  const { session, setShouldLogin, shouldLogin } = useAuth(redirectToSignIn, resetRedirect, isAllowApiKeyAuth);

  useSourcesInitializer();

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

  useEffect(() => {
    if (generationComplete) {
      router.push(`/content?${new URLSearchParams(window.location.search).toString()}`);
      dispatch(BuilderActions.resetGenerationComplete());
    }
  }, [generationComplete, dispatch, router]);

  if (!isAllowProvider) {
    return <AuthProviderError provider={chatAuthProvider ?? ''} availableProviders={providers} />;
  }

  if ((!session || !isClientSessionValid(session) || redirectToSignIn) && !isAllowApiKeyAuth) {
    return (
      <Login
        onClick={() => {
          setShouldLogin(true);
        }}
        shouldLogin={shouldLogin}
      />
    );
  }

  const getContent = () => {
    if (generatingStatus.isError)
      return <GeneratingErrorView title={generatingStatus.title} message={generatingStatus.details} />;
    if (generationStatus === GenerationStatus.IN_PROGRESS) return <GeneratingLoaderView />;
    if (isRedirect || isApplicationLoading || isSourcesLoading) return <Loader />;
    if (generationStatus === GenerationStatus.NOT_STARTED || generationStatus === GenerationStatus.FINISHED) {
      return <SourceEditor />;
    }
    return null;
  };

  const content = getContent();
  const shouldHaveToolbar = content && content.type === SourceEditor;

  return (
    <>
      {shouldHaveToolbar && <MainToolbar />}
      <div
        className={classNames(
          'absolute left-3 w-[calc(100%-24px)] h-[calc(100%-8px)]',
          shouldHaveToolbar && 'top-[70px] !h-[calc(100%-82px)]',
        )}
      >
        {getContent()}
      </div>
    </>
  );
};

export default SourcesPage;
