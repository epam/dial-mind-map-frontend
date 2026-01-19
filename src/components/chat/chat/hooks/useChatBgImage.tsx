import { CSSProperties } from 'react';

import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors } from '@/store/chat/ui/ui.reducers';
import { ChatImgResourceKey } from '@/types/customization';
import { getAppearanceFileUrl } from '@/utils/app/themes';

type ChatBgImageResult = {
  link: string | null;
  classes: string | null;
  style: CSSProperties | null;
};

export const useChatBgImage = (): ChatBgImageResult => {
  const appName = useChatSelector(ApplicationSelectors.selectApplicationName);
  const theme = useChatSelector(ChatUISelectors.selectThemeName);

  const chatBgImage = useChatSelector(AppearanceSelectors.selectChatConfig)?.images?.[ChatImgResourceKey.ChatBgImg];

  const fileUrl = chatBgImage ? getAppearanceFileUrl(appName, theme, chatBgImage) : null;

  if (!fileUrl) {
    return { link: null, classes: null, style: null };
  }

  return {
    link: fileUrl,
    classes: 'bg-cover bg-center',
    style: { backgroundImage: `url("${fileUrl}")` },
  };
};
