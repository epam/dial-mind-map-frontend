import { Observable } from 'rxjs';

import { Conversation, ConversationInfo } from '@/types/chat';

import { DataService } from './data-service';

export class ConversationService {
  public static updateConversation(conversation: Conversation): Observable<Conversation> {
    return DataService.getDataStorage().updateConversation(conversation);
  }

  public static getConversation(info: ConversationInfo): Observable<Conversation | null> {
    return DataService.getDataStorage().getConversation(info);
  }

  public static getConversations(path?: string, recursive?: boolean): Observable<ConversationInfo[]> {
    const data = DataService.getDataStorage().getConversations(path, recursive);
    return data;
  }

  public static createConversation(conversation: Conversation): Observable<Conversation> {
    return DataService.getDataStorage().createConversation(conversation);
  }
}
