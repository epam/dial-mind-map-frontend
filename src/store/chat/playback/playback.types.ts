import { Conversation } from '@/types/chat';

export interface PlaybackState {
  isPlayback: boolean;
  playbackInputText: null | string;
  playbackConversation: null | Conversation;
  isTypingPlaybackMessage: boolean;
  stepNumber: number;
  isBotStreaming: boolean;
  streamedBotMessage: string;
  isPlaybackUnavailable: boolean;
}
