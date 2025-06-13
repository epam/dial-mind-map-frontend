'use client';

import { ChatVisualizerConnector } from '@epam/ai-dial-chat-visualizer-connector';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { Mindmap } from '@/components/chat/Mindmap';
import { AuthProviderError } from '@/components/common/AuthProviderError';
import { Login } from '@/components/common/Login';
import { RecaptchaProvider } from '@/hooks/recaptcha/RecaptchaProvider';
import { useAuth } from '@/hooks/useAuth';
import { useChatAuthProvider } from '@/hooks/useChatAuthProvider';
import { useWindowSize } from '@/hooks/useWindowSize';
import { AnonymSessionSelectors } from '@/store/chat/anonymSession/anonymSession.slice';
import { chatAuthActions, ChatAuthSelectors } from '@/store/chat/chatAuth/chatAuth.slice';
import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { ChatUIActions, ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { isClientSessionValid } from '@/utils/auth/session';

const MinTabletWidth = 768;
const MinDesktopWidth = 1280;

const ChatPage = () => {
  const dispatch = useChatDispatch();
  const dialHost = useChatSelector(ChatUISelectors.selectDialChatHost);
  const mindmapIframeTitle = useChatSelector(ChatUISelectors.selectMindmapIframeTitle);
  const isInitialized = useRef(false);
  const chatVisualizerConnector = useRef<ChatVisualizerConnector | null>(null);
  const theme = useSearchParams().get('theme');
  const redirectToSignIn = useChatSelector(ChatAuthSelectors.selectRedirectToSignin);
  const resetRedirect = useCallback(() => dispatch(chatAuthActions.resetRedirect()), [dispatch]);
  const isAllowApiKey = useChatSelector(ChatUISelectors.selectIsAllowApiKey);
  const recaptchaSiteKey = useChatSelector(AnonymSessionSelectors.selectRecaptchaSiteKey);

  const providers = useChatSelector(ChatUISelectors.selectProviders);

  const { isAllowProvider, chatAuthProvider } = useChatAuthProvider({
    isAllowApiKeyAuth: isAllowApiKey,
    providers: providers,
  });

  const { session, setShouldLogin, shouldLogin } = useAuth(redirectToSignIn, resetRedirect, isAllowApiKey);

  const searchParams = useSearchParams();
  const [width, height] = useWindowSize();

  useEffect(() => {
    if (!width || !height) return;

    const determineDeviceType = () => {
      if (width < MinTabletWidth) return DeviceType.Mobile;
      if (width >= MinDesktopWidth) return DeviceType.Desktop;
      return DeviceType.Tablet;
    };

    dispatch(ChatUIActions.setDeviceType(determineDeviceType()));
  }, [width, height, dispatch]);

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

  useEffect(() => {
    if (!isInitialized.current) {
      if (!chatVisualizerConnector.current && dialHost && mindmapIframeTitle) {
        chatVisualizerConnector.current = new ChatVisualizerConnector(dialHost, mindmapIframeTitle, data => {
          setData(data);
        });
      }

      if (dialHost && mindmapIframeTitle) {
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
      dispatch(ChatUIActions.setTheme(theme));
    }

    return () => {
      chatVisualizerConnector.current?.destroy();
      chatVisualizerConnector.current = null;
    };
  }, [dispatch, theme, setData, applicationId, conversationId, dialHost, mindmapIframeTitle, session, isAllowApiKey]);

  if (!isAllowProvider) {
    return <AuthProviderError provider={chatAuthProvider ?? ''} availableProviders={providers} />;
  }

  if ((!session || !isClientSessionValid(session) || redirectToSignIn) && !isAllowApiKey)
    return (
      <Login
        onClick={() => {
          setShouldLogin(true);
        }}
        shouldLogin={shouldLogin}
      />
    );

  return (
    <RecaptchaProvider siteKey={recaptchaSiteKey} isApiKeyAllowed={isAllowApiKey}>
      <Mindmap />
    </RecaptchaProvider>
  );
};

export default ChatPage;
