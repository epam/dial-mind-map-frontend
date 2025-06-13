import classNames from 'classnames';
import { PropsWithChildren } from 'react';

import MindmapIcon from '@/icons/mindmap.svg';
import PersonIcon from '@/icons/person.svg';
import RobotIcon from '@/icons/robot.svg';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { useChatSelector } from '@/store/chat/hooks';
import { constructPath } from '@/utils/app/file';

interface Props {
  id?: string;
  className?: string;
  type: 'user' | 'chat' | 'robot';
  focused?: boolean;
}

export const Message = ({ children, type, id, focused }: PropsWithChildren<Props>) => {
  const application = useChatSelector(ApplicationSelectors.selectApplication);

  const getIcon = () => {
    switch (type) {
      case 'user':
        return (
          <PersonIcon
            className={classNames(['size-5 xl:size-7', focused && 'text-accent-primary fill-current'])}
            width={28}
            height={28}
          />
        );
      case 'chat':
        return application?.icon_url ? (
          <img
            className="size-5 xl:size-7"
            width={28}
            height={28}
            alt={application.name ?? ''}
            src={constructPath('/api', application.icon_url)}
          />
        ) : (
          <MindmapIcon width={28} height={28} className="size-5 xl:size-7" />
        );
      case 'robot':
        return <RobotIcon width={28} height={28} className="size-5 xl:size-7" />;
      default:
        return null;
    }
  };

  return (
    <div
      id={id}
      className={classNames([
        'flex gap-3 xl:gap-5 pl-3 xl:pl-7 py-2 xl:py-3 text-base pr-4',
        'border-l-2',
        focused && 'bg-layer-3 border-accent-primary',
        !focused && 'border-transparent',
      ])}
    >
      <div className="sticky top-0 size-5 xl:size-7">{getIcon()}</div>
      <div className="min-w-0 flex-1 text-sm leading-normal md:leading-[1.7] xl:text-base">{children}</div>
    </div>
  );
};
