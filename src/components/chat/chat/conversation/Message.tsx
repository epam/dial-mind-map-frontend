import classNames from 'classnames';
import { PropsWithChildren } from 'react';

import MindmapIcon from '@/icons/mindmap.svg';
import PersonIcon from '@/icons/person.svg';
import RobotIcon from '@/icons/robot.svg';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { IconResourceKey } from '@/types/customization';
import { constructPath } from '@/utils/app/file';
import { getAppearanceFileUrl } from '@/utils/app/themes';

interface Props {
  id?: string;
  type: 'user' | 'chat' | 'robot';
  focused?: boolean;
}

export const Message = ({ children, type, id, focused }: PropsWithChildren<Props>) => {
  const appName = useChatSelector(ApplicationSelectors.selectApplicationName);
  const theme = useChatSelector(ChatUISelectors.selectThemeName);
  const config = useChatSelector(AppearanceSelectors.selectThemeConfig);
  const appIconUrl = useChatSelector(ApplicationSelectors.selectApplication)?.icon_url;
  const icons = config?.icons;

  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isDesktop = deviceType === DeviceType.Desktop;
  const isTablet = deviceType === DeviceType.Tablet;
  const isMdUp = isTablet || isDesktop;

  const iconSizeClass = isDesktop ? 'size-7' : 'size-5';

  const getIcon = () => {
    switch (type) {
      case 'user':
        return icons?.[IconResourceKey.UserIcon] ? (
          <img
            className={iconSizeClass}
            width={28}
            height={28}
            alt="Chat user icon"
            src={getAppearanceFileUrl(appName, theme, icons[IconResourceKey.UserIcon])}
          />
        ) : (
          <PersonIcon
            className={classNames(iconSizeClass, focused && 'text-accent-primary fill-current')}
            width={28}
            height={28}
          />
        );

      case 'chat':
        return icons?.[IconResourceKey.MindmapIcon] || appIconUrl ? (
          <img
            className={iconSizeClass}
            width={28}
            height={28}
            alt={icons?.[IconResourceKey.MindmapIcon] || appName || ''}
            src={
              icons?.[IconResourceKey.MindmapIcon]
                ? getAppearanceFileUrl(appName, theme, icons[IconResourceKey.MindmapIcon])
                : constructPath('/api', appIconUrl)
            }
          />
        ) : (
          <MindmapIcon width={28} height={28} className={iconSizeClass} />
        );

      case 'robot':
        return icons?.[IconResourceKey.RobotIcon] ? (
          <img
            className={iconSizeClass}
            width={28}
            height={28}
            alt="Chat robot icon"
            src={getAppearanceFileUrl(appName, theme, icons[IconResourceKey.RobotIcon])}
          />
        ) : (
          <RobotIcon width={28} height={28} className={iconSizeClass} />
        );

      default:
        return null;
    }
  };

  const containerClasses = classNames(
    'flex pr-4 border-l-2 chat-conversation__message',
    isDesktop ? 'gap-5 pl-7 py-3' : 'gap-3 pl-3 py-2',
    focused ? 'bg-layer-3 border-accent-primary chat-conversation__message--active' : 'border-transparent',
    'text-base',
  );

  const iconWrapperClasses = classNames('chat-conversation__message-icon sticky top-0', iconSizeClass);

  const contentClasses = classNames(
    'min-w-0 flex-1',
    isDesktop ? 'text-base' : 'text-sm',
    isMdUp ? 'leading-[1.7]' : 'leading-normal',
    type === 'user' && 'whitespace-pre-line',
  );

  return (
    <div data-testid="chat-message" id={id} className={containerClasses}>
      <div className={iconWrapperClasses}>{getIcon()}</div>
      <div className={contentClasses}>{children}</div>
    </div>
  );
};
