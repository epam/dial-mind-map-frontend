import { IconTrash } from '@tabler/icons-react';

import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { ChatUIActions, ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';

import { AiGeneratedDisclaimer } from './AiGeneratedDisclaimer';
import { Conversation } from './conversation/Conversation';
import { Input } from './Input';
import { MobileSettings } from './MobileSettings';

export const ChatContent = () => {
  const dispatch = useChatDispatch();
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const conversation = useChatSelector(ConversationSelectors.selectConversation);

  return (
    <>
      <Conversation />
      <div className="m-3 flex flex-col gap-2 transition-all duration-300 xl:m-7 xl:mb-4">
        <AiGeneratedDisclaimer />
        <div className="flex gap-2">
          {deviceType === DeviceType.Mobile && <MobileSettings />}
          {deviceType === DeviceType.Tablet && (
            <button
              className="flex w-12 items-center justify-center rounded bg-layer-3 text-secondary hover:text-accent-primary disabled:cursor-not-allowed disabled:text-secondary"
              disabled={conversation.messages.length <= 2}
              onClick={() => dispatch(ChatUIActions.reset())}
              role="button"
            >
              <IconTrash />
            </button>
          )}
          <Input classes="flex-1" />
        </div>
      </div>
    </>
  );
};
