'use client';

import { ChatVisualizerConnector } from '@epam/ai-dial-chat-visualizer-connector';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { GraphError } from '@/components/chat/GraphError';
import { Mindmap } from '@/components/chat/Mindmap';
import { AuthProviderError } from '@/components/common/AuthProviderError';
import { Forbidden } from '@/components/common/Forbidden';
import { Login } from '@/components/common/Login';
import { NetworkOfflineBanner } from '@/components/common/NetworkOfflineBanner';
import { ServerUnavailableBanner } from '@/components/common/ServerUnavailableBanner';
import { MIN_DESKTOP_WIDTH_DEFAULT, MIN_TABLET_WIDTH_DEFAULT } from '@/constants/app';
import { RecaptchaProvider } from '@/hooks/recaptcha/RecaptchaProvider';
import { useAuth } from '@/hooks/useAuth';
import { useChatAuthProvider } from '@/hooks/useChatAuthProvider';
import { useWindowSize } from '@/hooks/useWindowSize';
import { AnonymSessionSelectors } from '@/store/chat/anonymSession/anonymSession.slice';
import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { chatAuthActions, ChatAuthSelectors } from '@/store/chat/chatAuth/chatAuth.slice';
import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { PlaybackSelectors } from '@/store/chat/playback/playback.selectors';
import { ChatUIActions, ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { isClientSessionValid } from '@/utils/auth/session';

const ChatPage = () => {
  const dispatch = useChatDispatch();
  const dialHost = useChatSelector(ChatUISelectors.selectDialChatHost);
  const dialIframeAllowedHosts = useChatSelector(ChatUISelectors.selectDialIframeAllowedHosts);
  const mindmapIframeTitle = useChatSelector(ChatUISelectors.selectMindmapIframeTitle);
  const isInitialized = useRef(false);
  const chatVisualizerConnector = useRef<ChatVisualizerConnector | null>(null);
  const theme = useSearchParams().get('theme');
  const redirectToSignIn = useChatSelector(ChatAuthSelectors.selectRedirectToSignin);
  const redirectToForbidden = useChatSelector(ChatAuthSelectors.selectRedirectToForbidden);
  const resetRedirect = useCallback(() => dispatch(chatAuthActions.resetRedirect()), [dispatch]);
  const isAllowApiKey = useChatSelector(ChatUISelectors.selectIsAllowApiKey);
  const recaptchaSiteKey = useChatSelector(AnonymSessionSelectors.selectRecaptchaSiteKey);
  const authUiMode = useChatSelector(ChatUISelectors.selectAuthUiMode);
  const isPlaybackUnavailable = useChatSelector(PlaybackSelectors.selectIsPlaybackUnavailable);
  const isRecaptchaConfigured = useChatSelector(AnonymSessionSelectors.selectIsRecaptchaConfigured);

  const providers = useChatSelector(ChatUISelectors.selectProviders);

  const config = useChatSelector(AppearanceSelectors.selectThemeConfig);
  const responsiveThresholds = config?.responsiveThresholds;

  const { isAllowProvider, chatAuthProvider } = useChatAuthProvider({
    isAllowApiKeyAuth: isAllowApiKey,
    providers: providers,
  });

  const { session, onLogin, shouldLogin } = useAuth(
    redirectToSignIn,
    resetRedirect,
    isAllowApiKey,
    authUiMode,
    isAllowProvider,
  );

  const searchParams = useSearchParams();
  const [width, height] = useWindowSize();

  useEffect(() => {
    if (!width || !height) return;

    const determineDeviceType = () => {
      if (width < (responsiveThresholds?.md ?? MIN_TABLET_WIDTH_DEFAULT)) return DeviceType.Mobile;
      if (width >= (responsiveThresholds?.xl ?? MIN_DESKTOP_WIDTH_DEFAULT)) return DeviceType.Desktop;
      return DeviceType.Tablet;
    };

    dispatch(ChatUIActions.setDeviceType(determineDeviceType()));
  }, [width, height, dispatch, responsiveThresholds]);

  const conversationId = decodeURIComponent(searchParams.get('conversationId') ?? '');
  const applicationId = decodeURIComponent(searchParams.get('id') ?? '');

  const setData = useCallback(
    (data: any) => {
      dispatch(ChatUIActions.setIsPreview(data.visualizerData?.isPreview));

      // if (conversationId && applicationId && !window.location.origin.startsWith('http://localhost:')) {
      //   dispatch(
      //     ConversationActions.init({
      //       conversationId: conversationId,
      //       applicationId: applicationId,
      //     }),
      //   );
      //   return;
      // }

      // if (
      //   data.visualizerData.conversationId &&
      //   data.visualizerData.conversationId !== conversation?.id &&
      //   !conversationId
      // ) {
      //   dispatch(
      //     ConversationActions.init({
      //       conversationId: data.visualizerData.conversationId,
      //       applicationId: applicationId,
      //     }),
      //   );
      // }
    },
    [dispatch],
  );

  const isOffline = useChatSelector(ChatUISelectors.selectIsOffline);
  const isServerUnavailable = useChatSelector(ChatUISelectors.selectIsServerUnavailable);

  useEffect(() => {
    if (!isInitialized.current) {
      const host = dialIframeAllowedHosts?.length ? dialIframeAllowedHosts : dialHost;

      if (!chatVisualizerConnector.current && host && mindmapIframeTitle) {
        chatVisualizerConnector.current = new ChatVisualizerConnector(host, mindmapIframeTitle, data => {
          setData(data);
        });
      }

      if (host && mindmapIframeTitle) {
        chatVisualizerConnector.current?.sendReady();
        chatVisualizerConnector.current?.sendReadyToInteract();
      }

      isInitialized.current = true;

      if (applicationId && ((session && isClientSessionValid(session)) || isAllowApiKey)) {
        dispatch(
          ConversationActions.init({
            conversationId: conversationId,
            applicationId: applicationId,
          }),
        );
      }
    }

    if (theme) {
      dispatch(ChatUIActions.setThemeName(theme));
    }

    return () => {
      chatVisualizerConnector.current?.destroy();
      chatVisualizerConnector.current = null;
    };
  }, [
    dispatch,
    theme,
    setData,
    applicationId,
    conversationId,
    dialHost,
    dialIframeAllowedHosts,
    mindmapIframeTitle,
    session,
    isAllowApiKey,
  ]);

  if (!isAllowProvider) {
    return <AuthProviderError provider={chatAuthProvider ?? ''} availableProviders={providers} />;
  }

  if (redirectToForbidden) {
    return <Forbidden />;
  }

  if ((!session || !isClientSessionValid(session) || redirectToSignIn) && !isAllowApiKey) {
    return <Login onClick={onLogin} shouldLogin={shouldLogin} />;
  }

  if (isPlaybackUnavailable) {
    return (
      <GraphError
        title="Playback isn’t available for this conversation."
        description="To use playback, try starting a new conversation."
        iconSize={60}
      />
    );
  }

  if (isServerUnavailable) {
    return <ServerUnavailableBanner />;
  }

  if (isOffline) {
    return <NetworkOfflineBanner />;
  }

  return (
    <RecaptchaProvider siteKey={recaptchaSiteKey} enabled={isRecaptchaConfigured}>
      <Mindmap />
    </RecaptchaProvider>
  );
};

export default ChatPage;
