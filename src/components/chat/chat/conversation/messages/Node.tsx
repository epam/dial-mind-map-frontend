import { IconArrowBigLeftFilled } from '@tabler/icons-react';
import classNames from 'classnames';
import { CSSProperties } from 'react';

import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';
import { PlaybackSelectors } from '@/store/chat/playback/playback.reducer';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { ChatNodeType } from '@/types/customization';
import { getAppearanceFileUrl } from '@/utils/app/themes';

interface Props {
  id: string;
  label: string;
  color: string;
  textColor: string;
  isVisited: boolean;
  isPrevious: boolean;
  size?: 'small' | 'default';
  type?: ChatNodeType;
  closeTooltip?: () => void;
  radius?: number;
  borderColor?: string;
  arrowBackIconName?: string;
  image?: string;
  maskImage?: string;
  hasVisitedOpacity?: boolean;
}

const getSizeClasses = (size: 'small' | 'default', isDesktop: boolean) => {
  switch (size) {
    case 'small':
      return 'py-1 px-2 text-xs';
    default:
      return classNames(
        'py-[6px]',
        isDesktop ? 'px-3 text-sm' : 'px-2 text-xs',
        'hover:outline hover:outline-[2.5px] hover:outline-offset-[-1px]',
      );
  }
};

export const Node = ({
  label,
  color,
  textColor,
  id,
  isVisited,
  isPrevious,
  size = 'default',
  type = ChatNodeType.Filled,
  closeTooltip,
  radius,
  borderColor,
  arrowBackIconName,
  image,
  maskImage,
  hasVisitedOpacity = true,
}: Props) => {
  const dispatch = useChatDispatch();
  const theme = useChatSelector(ChatUISelectors.selectThemeName);
  const appName = useChatSelector(ApplicationSelectors.selectApplicationName);
  const maskImagePath = maskImage && getAppearanceFileUrl(appName, theme, maskImage);
  const isPlayback = useChatSelector(PlaybackSelectors.selectIsPlayback);

  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isDesktop = deviceType === DeviceType.Desktop;

  const style: CSSProperties = { color: textColor };
  if (type === ChatNodeType.Imaged && image) {
    style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("${image}")`;
    style.backgroundRepeat = 'no-repeat';
    style.backgroundPosition = 'center';
    style.backgroundSize = 'cover';
    style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';

    if (maskImagePath) {
      style.position = 'relative';
      style.WebkitMaskImage = `url("${maskImagePath}")`;
      style.maskImage = `url("${maskImagePath}")`;
      style.maskSize = 'cover';
      style.maskRepeat = 'no-repeat';
      style.maskPosition = 'center';
    }
  } else if (type === ChatNodeType.Outlined) {
    style.borderColor = borderColor ?? textColor;
    style.outlineColor = textColor;
    style.borderWidth = 1;
  } else {
    style.backgroundColor = color;
    style.outlineColor = color;
  }

  if (radius) {
    style.borderRadius = `${radius}px`;
  }

  const getIcon = () => {
    if (arrowBackIconName) {
      return (
        <img
          width={16}
          height={16}
          alt="Arrow back icon"
          src={getAppearanceFileUrl(appName, theme, arrowBackIconName)}
        />
      );
    }

    return <IconArrowBigLeftFilled size={16} />;
  };

  return (
    <button
      data-testid="chat-node"
      onClick={async () => {
        dispatch(MindmapActions.handleNavigation({ clickedNodeId: id, shouldFetchGraph: true }));
        dispatch(ConversationActions.setMessageSending({ isMessageSending: false }));
        if (closeTooltip) {
          closeTooltip();
        }
      }}
      className={classNames([
        getSizeClasses(size, isDesktop),
        !radius && (isDesktop ? 'rounded-xl' : 'rounded-lg'),
        'chat-conversation__message-node',
      ])}
      style={style}
      disabled={isPlayback}
    >
      <span
        className={classNames(
          'flex items-center text-pretty',
          isPrevious && 'gap-1',
          isVisited && hasVisitedOpacity && 'opacity-60',
        )}
      >
        {isPrevious && getIcon()}
        {label}
      </span>
    </button>
  );
};
