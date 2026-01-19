import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';
import cloneDeep from 'lodash-es/cloneDeep';
import { ReactNode, useCallback, useMemo } from 'react';

import { Space } from '@/components/common/Space/Space';
import { useRecaptchaContext } from '@/hooks/recaptcha/RecaptchaProvider';
import RobotIcon from '@/icons/robot.svg';
import { ConversationActions, ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatUISelectors } from '@/store/chat/ui/ui.reducers';
import { AttachmentTitle, LikeState, Role } from '@/types/chat';
import { Node } from '@/types/graph';
import { replaceVisitedNode } from '@/utils/app/graph/common';
import { uuidv4 } from '@/utils/common/uuid';

import { Reactions } from './reactions/Reactions';

export const MessageActions = ({
  messageIndex,
  responseId,
  like,
}: {
  messageIndex: number;
  responseId?: string;
  like?: LikeState;
}) => {
  const dispatch = useChatDispatch();
  const chatDisclaimer = useChatSelector(ChatUISelectors.selectChatDisclaimer);
  const focusNodeId = useChatSelector(MindmapSelectors.selectFocusNodeId);
  const visitedNodes = useChatSelector(MindmapSelectors.selectVisitedNodes);
  const focusNode = useChatSelector(MindmapSelectors.selectFocusNode) as Node;
  const isMessageStreaming = useChatSelector(ConversationSelectors.selectIsMessageStreaming);
  const isMessageSending = useChatSelector(ConversationSelectors.selectIsMessageSending);
  const isRelayoutInProgress = useChatSelector(MindmapSelectors.selectRelayoutInProgress);
  const conversation = useChatSelector(ConversationSelectors.selectConversation);
  const { executeRecaptcha } = useRecaptchaContext();
  const isFirstResponse = messageIndex === 1;

  const { isAIGenerated, isNotAiGenerated, isError } = useMemo(() => {
    const message = conversation.messages[messageIndex];
    const isAssistant = message?.role === 'assistant';
    const hasGeneratedAttachment = message?.custom_content?.attachments?.some(
      a => a.title === AttachmentTitle['Generated graph node'],
    );

    return {
      isAIGenerated: isAssistant && !!hasGeneratedAttachment,
      isNotAiGenerated: isAssistant && !hasGeneratedAttachment,
      isError: !!message?.errorMessage,
    };
  }, [conversation, messageIndex]);

  const onRegenerateMessage = useCallback(
    (captchaToken: string) => {
      const id = uuidv4();
      const lastUserMessageIndex = conversation.messages.map(msg => msg.role).lastIndexOf(Role.User);
      const { messages } = conversation;
      dispatch(MindmapActions.setFocusNodeId(id));

      const adjustedVisited = replaceVisitedNode(cloneDeep(visitedNodes), focusNodeId, id);
      dispatch(MindmapActions.setVisitedNodes(adjustedVisited));

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
    [dispatch, conversation, visitedNodes, focusNodeId],
  );

  const regenerateHandler = useCallback(() => {
    executeRecaptcha(onRegenerateMessage);
  }, [onRegenerateMessage, executeRecaptcha]);

  if (isMessageStreaming || isFirstResponse) {
    return null;
  }

  const renderContent = (buttonLabel: string, buttonIcon: ReactNode, text?: string) => (
    <Space
      className={classNames([
        'text-xs text-secondary w-full mt-3 md:mt-4 chat-conversation__message-actions',
        isMessageSending && 'justify-between',
        !isMessageSending && 'justify-end',
      ])}
    >
      {text && isMessageSending && <DialEllipsisTooltip text={text} />}
      <div className="flex items-center gap-2">
        {isMessageSending && (
          <button
            onClick={regenerateHandler}
            disabled={isRelayoutInProgress || isMessageStreaming}
            className="flex gap-1 whitespace-nowrap text-xs font-semibold text-secondary transition duration-300 hover:text-accent-primary"
          >
            {buttonIcon}
            <span>{buttonLabel}</span>
          </button>
        )}

        {responseId && <Reactions responseId={responseId} like={like} messageIndex={messageIndex} />}
      </div>
    </Space>
  );

  if (isNotAiGenerated && !isError) {
    return renderContent('Try AI', <RobotIcon width={16} height={16} />, `Content of "${focusNode?.label}"`);
  }

  if (isAIGenerated || isError) {
    return renderContent('Retry', <IconRefresh size={16} />, chatDisclaimer);
  }
};
