import { IconRefresh, IconSend } from '@tabler/icons-react';
import classNames from 'classnames';
import { useCallback, useRef } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import { NEW_QUESTION_LABEL } from '@/constants/app';
import { useRecaptchaContext } from '@/hooks/recaptcha/RecaptchaProvider';
import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { ConversationActions, ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { Role } from '@/types/chat';
import { uuidv4 } from '@/utils/common/uuid';

export const Input = ({ classes }: { classes?: string }) => {
  const dispatch = useChatDispatch();
  const isMessageStreaming = useChatSelector(ConversationSelectors.selectIsMessageStreaming);
  const hasAppProperties = useChatSelector(ApplicationSelectors.selectHasAppProperties);
  const isMindmapNotFound = useChatSelector(MindmapSelectors.selectIsNotFound);
  const isLastMessageError = useChatSelector(ConversationSelectors.selectIsLastMessageError);
  const conversation = useChatSelector(ConversationSelectors.selectConversation);
  const messages = conversation.messages;
  const formRef = useRef<HTMLFormElement>(null);
  const {
    isEnabled: isRecaptchaEnabled,
    isLoaded: isCaptchaLoaded,
    isExecuting: isCaptchaExecuting,
    executeRecaptcha,
  } = useRecaptchaContext();

  const onRegenerateMessage = useCallback(
    (captchaToken: string) => {
      const lastUserMessageIndex = messages.map(msg => msg.role).lastIndexOf(Role.User);
      dispatch(
        ConversationActions.sendMessages({
          message: messages[lastUserMessageIndex],
          deleteCount: messages.length - lastUserMessageIndex,
          captchaToken,
        }),
      );
    },
    [dispatch, messages],
  );

  const submitForm = useCallback(
    (message: string, captchaToken: string) => {
      if (message) {
        const id = uuidv4();
        dispatch(MindmapActions.setFallbackElements());
        dispatch(ConversationActions.setMessageSending({ isMessageSending: true }));
        dispatch(
          MindmapActions.addLinkedToFocusedElement({
            id,
            label: NEW_QUESTION_LABEL,
          }),
        );

        dispatch(MindmapActions.handleNavigation({ clickedNodeId: id, shouldFetchGraph: false }));

        dispatch(
          ConversationActions.sendMessages({
            message: {
              id: id,
              content: message,
              role: Role.User,
            },
            captchaToken,
          }),
        );
      }

      // Reset chat input after sending the message
      if (formRef.current) {
        formRef.current.reset();
      }
    },
    [dispatch],
  );

  return (
    <form
      ref={formRef}
      className={classNames([classes, 'relative'])}
      onSubmit={async event => {
        event.preventDefault();

        if (
          isMessageStreaming ||
          !hasAppProperties ||
          isMindmapNotFound ||
          (isRecaptchaEnabled && (isCaptchaExecuting || !isCaptchaLoaded))
        ) {
          return;
        }

        if (isLastMessageError) {
          executeRecaptcha(token => onRegenerateMessage(token));
        } else {
          const formData = new FormData(formRef.current!);
          const message = formData.get('message') as string;
          executeRecaptcha(token => submitForm(message, token));
        }
      }}
    >
      <input
        className={classNames([
          'rounded-[3px] bg-layer-3 h-11 md:h-[48px] w-full py-[14px] pl-4 pr-14 text-base placeholder:text-sm placeholder:xl:text-base',
          (!hasAppProperties || isMindmapNotFound) && 'placeholder:text-controls-disable pointer-events-none',
        ])}
        placeholder="Type your question"
        name="message"
        disabled={
          !hasAppProperties ||
          isLastMessageError ||
          isMindmapNotFound ||
          (isRecaptchaEnabled && (isCaptchaExecuting || !isCaptchaLoaded))
        }
      />
      <button
        type="submit"
        disabled={!hasAppProperties || (isRecaptchaEnabled && (isCaptchaExecuting || !isCaptchaLoaded))}
        className={classNames([
          'absolute right-3 top-3 hover:text-accent-primary hover:cursor-pointer group transition-colors duration-200',
          !hasAppProperties ||
            (isRecaptchaEnabled &&
              (isCaptchaExecuting || !isCaptchaLoaded) &&
              'text-controls-disable pointer-events-none'),
          isLastMessageError && 'text-error hover:text-error',
        ])}
      >
        {!isLastMessageError ? (
          <IconSend />
        ) : (
          <Tooltip tooltip="Regenerate response" contentClassName="text-sm text-primary">
            <IconRefresh />
          </Tooltip>
        )}
      </button>
    </form>
  );
};
