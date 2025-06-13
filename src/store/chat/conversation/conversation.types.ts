import { Conversation, ConversationInfo } from '@/types/chat';

export interface ConversationState {
  conversation: Conversation;
  conversationSignal: AbortController;
  isMessageSending: boolean;
  conversations: ConversationInfo[];
}
