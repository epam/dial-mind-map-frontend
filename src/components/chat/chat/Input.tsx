import { IconRefresh, IconSend } from '@tabler/icons-react';
import classNames from 'classnames';
import { useCallback, useRef } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import { ChatInputPlaceholder, NEW_QUESTION_LABEL } from '@/constants/app';
import { useRecaptchaContext } from '@/hooks/recaptcha/RecaptchaProvider';
import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { ConversationActions, ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { Role } from '@/types/chat';
import { uuidv4 } from '@/utils/common/uuid';

export const Input = ({ classes }: { classes?: string }) => {
  const dispatch = useChatDispatch();
  const isMessageStreaming = useChatSelector(ConversationSelectors.selectIsMessageStreaming);
  const isRelayoutInProgress = useChatSelector(MindmapSelectors.selectRelayoutInProgress);
  const hasAppProperties = useChatSelector(ApplicationSelectors.selectHasAppProperties);
  const isMindmapNotFound = useChatSelector(MindmapSelectors.selectIsNotFound);
  const isLastMessageError = useChatSelector(ConversationSelectors.selectIsLastMessageError);
  const conversation = useChatSelector(ConversationSelectors.selectConversation);
  const placeholder = useChatSelector(AppearanceSelectors.selectChatConfig)?.placeholder ?? ChatInputPlaceholder;
  const isGraphFetching = useChatSelector(MindmapSelectors.selectIsGraphFetching);

  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isDesktop = deviceType === DeviceType.Desktop;
  const isTablet = deviceType === DeviceType.Tablet;
  const isMdUp = isTablet || isDesktop;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const style = window.getComputedStyle(textarea);
    const borderTop = parseInt(style.borderTopWidth, 10);
    const borderBottom = parseInt(style.borderBottomWidth, 10);

    const newHeight = Math.min(textarea.scrollHeight + borderTop + borderBottom, 150);
    textarea.style.height = `${newHeight}px`;
  }, []);

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

        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        if (
          isMessageStreaming ||
          !hasAppProperties ||
          isMindmapNotFound ||
          (isRecaptchaEnabled && (isCaptchaExecuting || !isCaptchaLoaded)) ||
          isGraphFetching ||
          isRelayoutInProgress
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
      <textarea
        ref={textareaRef}
        rows={1}
        onInput={adjustHeight}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        className={classNames(
          'flex rounded-[3px] bg-layer-3 w-full pl-4 pr-14 chat-footer__input resize-none grow max-h-[150px] overflow-y-auto',
          isTablet ? 'py-[14px]' : 'py-[12px]',
          isDesktop ? 'text-base placeholder:text-base' : 'text-sm placeholder:text-sm',
          (!hasAppProperties || isMindmapNotFound) && 'placeholder:text-controls-disable pointer-events-none',
        )}
        placeholder={placeholder}
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
          'absolute right-3  hover:text-accent-primary hover:cursor-pointer group transition-colors duration-200 chat-footer__submit-btn',
          isMdUp ? 'bottom-[12px]' : 'bottom-[10px]',
          !hasAppProperties ||
            (isRecaptchaEnabled &&
              (isCaptchaExecuting || !isCaptchaLoaded) &&
              'text-controls-disable pointer-events-none'),
          isLastMessageError && 'text-error hover:text-error',
        ])}
      >
        {!isLastMessageError ? (
          <IconSend stroke={1.5} />
        ) : (
          <Tooltip tooltip="Regenerate response" contentClassName="text-sm text-primary">
            <IconRefresh />
          </Tooltip>
        )}
      </button>
    </form>
  );
};
