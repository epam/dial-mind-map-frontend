import classNames from 'classnames';

import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';

import { ChatContent } from './ChatContent';
import { useChatBgImage } from './hooks/useChatBgImage';
import { Toolbar } from './Toolbar';

export const DesktopChat = () => {
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);
  const { classes: chatBgImageClasses, style: chatBgImageInlineStyles } = useChatBgImage();

  const isDesktop = deviceType === DeviceType.Desktop;

  const containerClasses = classNames(
    'border-primary bg-layer-1 rounded-[10px] border-2 h-full flex flex-col relative chat-container',
    isDesktop && !isMapHidden && 'w-1/3',
    isDesktop && isMapHidden && 'w-full',
    !isDesktop && 'w-full',
    isMapHidden && 'max-w-[800px]',
    chatBgImageClasses,
  );

  return (
    <div className={containerClasses} data-testid="desktop-chat" style={chatBgImageInlineStyles ?? undefined}>
      {isDesktop && <Toolbar />}
      <ChatContent />
    </div>
  );
};
