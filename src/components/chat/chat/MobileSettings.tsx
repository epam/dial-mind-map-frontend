import {
  autoUpdate,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useInteractions,
} from '@floating-ui/react';
import { IconSettings, IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';
import { useState } from 'react';

import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { ChatUIActions } from '@/store/chat/ui/ui.reducers';

import { LevelSwitcher } from '../LevelSwitcher';

export const MobileSettings = () => {
  const dispatch = useChatDispatch();
  const hasAppProperties = useChatSelector(ApplicationSelectors.selectHasAppProperties);
  const conversation = useChatSelector(ConversationSelectors.selectConversation);
  const [isOpen, setIsOpen] = useState(false);
  const { refs, context, strategy, x, y } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(5)],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useFocus(context),
    useDismiss(context),
  ]);

  return (
    <>
      <button
        disabled={!hasAppProperties}
        className={classNames([
          'self-end mobile-menu-toggle-button size-11 flex justify-center items-center bg-layer-3 rounded text-secondary hover:text-accent-primary',
          !hasAppProperties && 'pointer-events-none',
        ])}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <IconSettings size={24} className={classNames([!hasAppProperties && 'text-controls-disable'])} />
      </button>
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={{
              zIndex: 100500,
              position: strategy,
              top: y != null ? y : '',
              left: x != null ? x : '',
            }}
            {...getFloatingProps()}
            className="mobile-menu flex flex-col rounded border border-primary bg-layer-0 text-primary"
          >
            <LevelSwitcher classes="p-3" onChange={() => setIsOpen(false)} />
            <button
              className="history-reset-button group flex items-center gap-1 border-t border-primary p-3 text-sm hover:text-accent-primary disabled:cursor-not-allowed disabled:text-secondary"
              onClick={() => {
                dispatch(ChatUIActions.reset());
                setIsOpen(false);
              }}
              disabled={conversation.messages.length <= 2}
            >
              <IconTrash
                size={18}
                className={classNames([
                  'text-secondary',
                  conversation.messages.length > 2 && 'group-hover:text-accent-primary',
                ])}
              />
              Reset history
            </button>
          </div>
        )}
      </FloatingPortal>
    </>
  );
};
