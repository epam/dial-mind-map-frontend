import { IconSitemap, IconSitemapOff, IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { ChatUIActions, ChatUISelectors } from '@/store/chat/ui/ui.reducers';

export const Toolbar = () => {
  const dispatch = useChatDispatch();
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);
  const conversation = useChatSelector(ConversationSelectors.selectConversation);

  return (
    <div className="mx-7 flex min-h-[50px] items-center justify-end gap-4">
      <button
        className="group flex gap-1 transition-colors duration-200 hover:cursor-pointer hover:text-accent-primary"
        onClick={() => dispatch(ChatUIActions.setIsMapHidden(!isMapHidden))}
      >
        {isMapHidden ? (
          <>
            <IconSitemap
              size={18}
              className="text-secondary transition-colors duration-200 group-hover:text-accent-primary"
            />
            <div>Show map</div>
          </>
        ) : (
          <>
            <IconSitemapOff
              size={18}
              className="text-secondary transition-colors duration-200 group-hover:text-accent-primary"
            />
            <div>Hide map</div>
          </>
        )}
      </button>
      <button
        className="group flex gap-1 transition-colors duration-200 hover:cursor-pointer hover:text-accent-primary disabled:cursor-not-allowed disabled:text-secondary"
        onClick={() => dispatch(ChatUIActions.reset())}
        disabled={conversation.messages.length <= 2}
      >
        <IconTrash
          size={18}
          className={classNames([
            'text-secondary transition-colors duration-200',
            conversation.messages.length > 2 && 'group-hover:text-accent-primary',
          ])}
        />
        <div>Reset</div>
      </button>
    </div>
  );
};
