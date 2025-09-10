import classNames from 'classnames';

import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';

import { ChatContent } from './ChatContent';
import { Toolbar } from './Toolbar';

export const DesktopChat = () => {
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);

  return (
    <div
      className={classNames([
        'border-primary bg-layer-1 rounded-[10px] border-2 h-full flex flex-col relative w-full xl:h-full xl:w-1/3 chat-container',
        isMapHidden && 'xl:w-full max-w-[800px]',
      ])}
      data-testid="desktop-chat"
    >
      {deviceType === DeviceType.Desktop && <Toolbar />}
      <ChatContent />
    </div>
  );
};
