import { IconArrowBigLeftFilled } from '@tabler/icons-react';
import classNames from 'classnames';

import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch } from '@/store/chat/hooks';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';

interface Props {
  id: string;
  label: string;
  color: string;
  isVisited: boolean;
  isPrevious: boolean;
  size?: 'small' | 'default';
  closeTooltip?: () => void;
}

const getSizeStyles = (size: 'small' | 'default') => {
  switch (size) {
    case 'small':
      return 'py-1 px-2 text-xs';
    default:
      return 'py-[6px] px-2 text-xs xl:text-sm xl:px-3';
  }
};

export const Node = ({ label, color, id, isVisited, isPrevious, size = 'default', closeTooltip }: Props) => {
  const dispatch = useChatDispatch();

  return (
    <button
      onClick={async () => {
        dispatch(MindmapActions.handleNavigation({ clickedNodeId: id, shouldFetchGraph: true }));
        dispatch(ConversationActions.setMessageSending({ isMessageSending: false }));
        if (closeTooltip) {
          closeTooltip();
        }
      }}
      className={classNames([
        'rounded-lg xl:rounded-xl flex items-center text-pretty text-controls-permanent hover:outline hover:outline-[2.5px] hover:outline-offset-[-1px]',
        isVisited && 'text-secondary',
        isPrevious && 'gap-1',
        getSizeStyles(size),
      ])}
      style={{
        backgroundColor: color,
        outlineColor: color,
      }}
    >
      {isPrevious && <IconArrowBigLeftFilled size={16} />}
      {label}
    </button>
  );
};
