import classNames from 'classnames';
import { throttle } from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { montserrat } from '@/fonts/fonts';
import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatSelector } from '@/store/chat/hooks';
import { MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { AttachmentTitle, Role } from '@/types/chat';
import { getFocusNodeResponseId } from '@/utils/app/conversation';

import { Message } from './Message';
import { ChatMessageBody } from './messages/ChatMessageBody';

const scrollThrottlingTimeout = 250;
const scrollToFocusNodeTimeout = 50;

export const Conversation = () => {
  const { messages, isMessageStreaming } = useChatSelector(ConversationSelectors.selectConversation);
  const focusNodeId = useChatSelector(MindmapSelectors.selectFocusNodeId);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(false);
  const isGraphFetching = useChatSelector(MindmapSelectors.selectIsGraphFetching);
  const disableAutoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const isScrollingToFocusedRef = useRef(false);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    isScrollingToFocusedRef.current = true;
    setTimeout(() => {
      if (focusNodeId && !isGraphFetching) {
        const element = document.getElementById(focusNodeId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
      isScrollingToFocusedRef.current = false;
    }, scrollToFocusNodeTimeout);
  }, [focusNodeId, isGraphFetching]);

  const setAutoScroll = () => {
    clearTimeout(disableAutoScrollTimeoutRef.current);
    setAutoScrollEnabled(true);
  };

  const scrollDown = useCallback(() => {
    if (autoScrollEnabled && !isScrollingToFocusedRef.current) {
      setAutoScroll();
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
      });
    }
  }, [autoScrollEnabled]);

  useEffect(() => {
    scrollDown();
  }, [scrollDown]);

  const throttledScrollDown = useMemo(() => throttle(scrollDown, scrollThrottlingTimeout), [scrollDown]);

  useEffect(() => {
    if (isMessageStreaming) {
      handleScroll();
    }
    throttledScrollDown();
  }, [messages, isMessageStreaming, throttledScrollDown]);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const bottomTolerance = 25;

      if (lastScrollTop.current > scrollTop) {
        setAutoScrollEnabled(false);
      } else if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        clearTimeout(disableAutoScrollTimeoutRef.current);
        disableAutoScrollTimeoutRef.current = setTimeout(() => {
          setAutoScrollEnabled(false);
        }, scrollThrottlingTimeout);
      } else {
        setAutoScroll();
      }

      lastScrollTop.current = scrollTop;
    }
  }, []);

  return (
    <div
      className="h-full overflow-x-hidden overflow-y-scroll scroll-smooth"
      ref={chatContainerRef}
      onScroll={handleScroll}
    >
      <div className={classNames(['h-full flex flex-col', montserrat.className])}>
        {messages.map((message, messageIndex) => {
          return message.role === Role.User ? (
            <Message
              type="user"
              key={message.id}
              id={message.id}
              focused={message.id?.replace('-response', '') === focusNodeId}
            >
              {message.content}
            </Message>
          ) : (
            <Message
              type={
                message.custom_content?.attachments?.some(
                  attachment => attachment.title === AttachmentTitle['Generated graph node'],
                ) ||
                (isMessageStreaming && messageIndex === messages.length - 1)
                  ? 'robot'
                  : 'chat'
              }
              key={message.id}
            >
              <ChatMessageBody
                isMessageStreaming={isMessageStreaming}
                isLastMessage={messageIndex === messages.length - 1}
                message={message}
                nodes={
                  getFocusNodeResponseId(focusNodeId) === message.id && !isMessageStreaming
                    ? message.availableNodes
                    : undefined
                }
              />
            </Message>
          );
        })}
      </div>
    </div>
  );
};
