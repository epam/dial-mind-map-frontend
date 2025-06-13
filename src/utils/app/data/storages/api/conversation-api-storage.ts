import { catchError, forkJoin, Observable, of } from 'rxjs';

import { ChatRootState } from '@/store/chat';
import { ConversationSelectors } from '@/store/chat/conversation/conversation.reducers';
import { Conversation, ConversationInfo } from '@/types/chat';
import { ApiKeys, UploadStatus } from '@/types/common';
import { cleanConversation } from '@/utils/app/clean';
import { isEntityIdLocal } from '@/utils/app/id';
import { getConversationApiKey, parseConversationApiKey } from '@/utils/server/api';

import { ConversationService } from '../../conversation-service';
import { ApiEntityStorage } from './api-entity-storage';

export class ConversationApiStorage extends ApiEntityStorage<ConversationInfo, Conversation> {
  mergeGetResult(info: ConversationInfo, entity: Conversation): Conversation {
    return {
      ...entity,
      ...info,
      lastActivityDate: info.lastActivityDate ?? entity.lastActivityDate,
      model: entity.model,
    };
  }

  cleanUpEntity(conversation: Conversation): Conversation {
    return cleanConversation(conversation);
  }

  getEntityKey(info: ConversationInfo): string {
    return getConversationApiKey(info);
  }

  parseEntityKey(key: string): Omit<ConversationInfo, 'folderId' | 'id'> {
    return parseConversationApiKey(key);
  }

  getStorageKey(): ApiKeys {
    return ApiKeys.Conversations;
  }
}

export const getOrUploadConversation = <T extends { id: string }>(
  payload: T,
  state: ChatRootState,
): Observable<{
  conversation: Conversation | null;
  payload: T;
}> => {
  const conversation = ConversationSelectors.selectConversation(state);

  if (conversation && conversation?.status !== UploadStatus.LOADED && !isEntityIdLocal(conversation)) {
    return forkJoin({
      conversation: ConversationService.getConversation(conversation).pipe(
        catchError(err => {
          console.error('The conversation was not found:', err);
          return of(null);
        }),
      ),
      payload: of(payload),
    });
  } else {
    return forkJoin({
      conversation: of((conversation as Conversation) ?? null),
      payload: of(payload),
    });
  }
};
