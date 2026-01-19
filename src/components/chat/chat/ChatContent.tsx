import { IconTrash } from '@tabler/icons-react';

import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { PlaybackSelectors } from '@/store/chat/playback/playback.selectors';
import { ChatUIActions, ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';

import { Conversation } from './conversation/Conversation';
import { Input } from './Input';
import { MobileSettings } from './MobileSettings';
import { PlaybackInput } from './PlaybackInput';

export const ChatContent = () => {
  const dispatch = useChatDispatch();
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const conversation = useChatSelector(ConversationSelectors.selectConversation);
  const isPlayback = useChatSelector(PlaybackSelectors.selectIsPlayback);

  return (
    <>
      <Conversation />
      <div className="chat-footer m-3 flex flex-col gap-2 transition-all duration-300 xl:m-4 xl:gap-3">
        <div className="flex items-center gap-2">
          {deviceType === DeviceType.Mobile && <MobileSettings />}
          {deviceType === DeviceType.Tablet && (
            <button
              className="history-reset-button flex size-12 items-center justify-center self-end rounded bg-layer-3 text-secondary hover:text-accent-primary disabled:cursor-not-allowed disabled:text-secondary"
              disabled={conversation.messages.length <= 2}
              onClick={() => dispatch(ChatUIActions.reset())}
              role="button"
            >
              <IconTrash />
            </button>
          )}
          {isPlayback ? <PlaybackInput /> : <Input classes="flex-1" />}
        </div>
      </div>
    </>
  );
};
