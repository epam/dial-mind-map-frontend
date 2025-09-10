import classNames from 'classnames';
import { PropsWithChildren } from 'react';

import MindmapIcon from '@/icons/mindmap.svg';
import PersonIcon from '@/icons/person.svg';
import RobotIcon from '@/icons/robot.svg';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors } from '@/store/chat/ui/ui.reducers';
import { IconResourceKey } from '@/types/customization';
import { constructPath } from '@/utils/app/file';
import { getAppearanceFileUrl } from '@/utils/app/themes';

interface Props {
  id?: string;
  className?: string;
  type: 'user' | 'chat' | 'robot';
  focused?: boolean;
}

export const Message = ({ children, type, id, focused }: PropsWithChildren<Props>) => {
  const appName = useChatSelector(ApplicationSelectors.selectApplicationName);
  const appFolder = useChatSelector(ApplicationSelectors.selectMindmapFolder);
  const theme = useChatSelector(ChatUISelectors.selectThemeName);
  const config = useChatSelector(AppearanceSelectors.selectThemeConfig);
  const appIconUrl = useChatSelector(ApplicationSelectors.selectApplication)?.icon_url;
  const icons = config?.icons;

  const getIcon = () => {
    switch (type) {
      case 'user':
        return icons?.[IconResourceKey.UserIcon] ? (
          <img
            className="size-5 xl:size-7"
            width={28}
            height={28}
            alt="Chat user icon"
            src={getAppearanceFileUrl(appName, theme, icons[IconResourceKey.UserIcon], appFolder)}
          />
        ) : (
          <PersonIcon
            className={classNames(['size-5 xl:size-7', focused && 'text-accent-primary fill-current'])}
            width={28}
            height={28}
          />
        );
      case 'chat':
        return icons?.[IconResourceKey.MindmapIcon] || appIconUrl ? (
          <img
            className="size-5 xl:size-7"
            width={28}
            height={28}
            alt={icons?.[IconResourceKey.MindmapIcon] || appName || ''}
            src={
              icons?.[IconResourceKey.MindmapIcon]
                ? getAppearanceFileUrl(appName, theme, icons[IconResourceKey.MindmapIcon], appFolder)
                : constructPath('/api', appIconUrl)
            }
          />
        ) : (
          <MindmapIcon width={28} height={28} className="size-5 xl:size-7" />
        );
      case 'robot':
        return icons?.[IconResourceKey.RobotIcon] ? (
          <img
            className="size-5 xl:size-7"
            width={28}
            height={28}
            alt="Chat robot icon"
            src={getAppearanceFileUrl(appName, theme, icons[IconResourceKey.RobotIcon], appFolder)}
          />
        ) : (
          <RobotIcon width={28} height={28} className="size-5 xl:size-7" />
        );
      default:
        return null;
    }
  };

  return (
    <div
      data-testid="chat-message"
      id={id}
      className={classNames([
        'flex gap-3 xl:gap-5 pl-3 xl:pl-7 py-2 xl:py-3 text-base pr-4 border-l-2 chat-conversation__message',
        focused && 'bg-layer-3 border-accent-primary chat-conversation__message--active',
        !focused && 'border-transparent',
      ])}
    >
      <div className="chat-conversation__message-icon sticky top-0 size-5 xl:size-7">{getIcon()}</div>
      <div className="min-w-0 flex-1 text-sm leading-normal md:leading-[1.7] xl:text-base">{children}</div>
    </div>
  );
};
