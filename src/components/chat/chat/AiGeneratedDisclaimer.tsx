import { IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';
import { useCallback, useMemo } from 'react';

import { Space } from '@/components/common/Space/Space';
import { useRecaptchaContext } from '@/hooks/recaptcha/RecaptchaProvider';
import RobotIcon from '@/icons/robot.svg';
import { ConversationActions, ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatUISelectors } from '@/store/chat/ui/ui.reducers';
import { AttachmentTitle, Role } from '@/types/chat';
import { Node } from '@/types/graph';
import { getFocusNodeResponseId } from '@/utils/app/conversation';
import { uuidv4 } from '@/utils/common/uuid';

export const AiGeneratedDisclaimer = () => {
  const dispatch = useChatDispatch();
  const chatDisclaimer = useChatSelector(ChatUISelectors.selectChatDisclaimer);
  const isMessageSending = useChatSelector(ConversationSelectors.selectIsMessageSending);
  const focusNodeId = useChatSelector(MindmapSelectors.selectFocusNodeId);
  const focusNode = useChatSelector(MindmapSelectors.selectFocusNode) as Node;
  const isMessageStreaming = useChatSelector(ConversationSelectors.selectIsMessageStreaming);
  const { executeRecaptcha } = useRecaptchaContext();

  const conversation = useChatSelector(ConversationSelectors.selectConversation);
  const isLastMessageAIGenerated = useMemo(() => {
    const lastMessage = conversation.messages.at(-1);
    return (
      lastMessage?.role === 'assistant' &&
      lastMessage.custom_content?.attachments?.some(
        attachment => attachment.title === AttachmentTitle['Generated graph node'],
      )
    );
  }, [conversation]);

  const isLastMessageNotAiGenerated = useMemo(() => {
    const lastMessage = conversation.messages.at(-1);
    return (
      lastMessage?.role === 'assistant' &&
      !lastMessage.custom_content?.attachments?.some(
        attachment => attachment.title === AttachmentTitle['Generated graph node'],
      )
    );
  }, [conversation]);

  const shouldShowTryAi = useMemo(() => {
    const lastMessage = conversation.messages.at(-1);
    return (
      isLastMessageNotAiGenerated && lastMessage?.id === getFocusNodeResponseId(focusNodeId) && !isMessageStreaming
    );
  }, [conversation, isMessageStreaming, isLastMessageNotAiGenerated, focusNodeId]);

  const onRegenerateMessage = useCallback(
    (captchaToken: string) => {
      const id = uuidv4();
      const lastUserMessageIndex = conversation.messages.map(msg => msg.role).lastIndexOf(Role.User);
      const { messages } = conversation;
      dispatch(
        ConversationActions.sendMessages({
          message: { ...messages[lastUserMessageIndex], id: id },
          deleteCount: messages.length - lastUserMessageIndex,
          captchaToken,
          customFields: {
            configuration: {
              force_answer_generation: true,
            },
          },
        }),
      );
    },
    [dispatch, conversation],
  );

  const regenerateHandler = useCallback(() => {
    executeRecaptcha(onRegenerateMessage);
  }, [onRegenerateMessage, executeRecaptcha]);

  if (!isMessageSending) {
    return null;
  }

  if (shouldShowTryAi) {
    return (
      <Space className={classNames(['text-xs text-secondary justify-center w-full'])}>
        <span>Content of {`"${focusNode?.label}"`}</span>
        <button
          onClick={regenerateHandler}
          className="flex gap-1 whitespace-nowrap text-xs font-semibold text-secondary transition duration-300 hover:text-accent-primary"
        >
          <RobotIcon width={16} height={16} />
          <span>Try AI</span>
        </button>
      </Space>
    );
  }

  return (
    chatDisclaimer &&
    isLastMessageAIGenerated && (
      <Space className={classNames(['text-xs text-secondary justify-center'])}>
        <span>{chatDisclaimer}</span>
        <button
          onClick={regenerateHandler}
          className="flex gap-1 text-xs font-semibold text-secondary transition duration-300 hover:text-accent-primary"
        >
          <IconRefresh size={16} />
          <span>Retry</span>
        </button>
      </Space>
    )
  );
};
