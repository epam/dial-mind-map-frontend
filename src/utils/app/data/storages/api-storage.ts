import { Observable } from 'rxjs';

import { Conversation, ConversationInfo } from '@/types/chat';
import { DialStorage } from '@/types/storage';

import { ConversationApiStorage } from './api/conversation-api-storage';

export class ApiStorage implements DialStorage {
  private _conversationApiStorage = new ConversationApiStorage();

  getConversations(path?: string, recursive?: boolean): Observable<ConversationInfo[]> {
    return this._conversationApiStorage.getEntities(path, recursive);
  }

  getConversation(info: ConversationInfo): Observable<Conversation | null> {
    return this._conversationApiStorage.getEntity(info);
  }

  updateConversation(conversation: Conversation): Observable<Conversation> {
    return this._conversationApiStorage.updateEntity(conversation);
  }

  createConversation(conversation: Conversation): Observable<Conversation> {
    return this._conversationApiStorage.createEntity(conversation);
  }
}
