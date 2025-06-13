import { map, Observable, of, throwError } from 'rxjs';

import { errorsMessages } from '@/constants/errors';
import { Conversation, ConversationInfo } from '@/types/chat';
import { DialStorage, UIStorageKeys } from '@/types/storage';

const isLocalStorageEnabled = () => {
  const testData = 'test';
  try {
    localStorage.setItem(testData, testData);
    localStorage.removeItem(testData);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error(errorsMessages.localStorageQuotaExceeded);
      return true;
    } else {
      return false;
    }
  }
};

export class BrowserStorage implements DialStorage {
  private static storage: globalThis.Storage | undefined;

  public static init() {
    if (isLocalStorageEnabled()) {
      BrowserStorage.storage = localStorage;
    } else {
      BrowserStorage.storage = sessionStorage;
    }
  }

  getConversation(info: ConversationInfo): Observable<Conversation | null> {
    return BrowserStorage.getData(UIStorageKeys.ConversationHistory, []).pipe(
      map(conversations => {
        const conv = conversations.find((conv: Conversation) => conv.id === info.id);
        return conv ? conv : null;
      }),
    );
  }

  getConversations(): Observable<ConversationInfo[]> {
    return BrowserStorage.getData(UIStorageKeys.ConversationHistory, []);
  }

  updateConversation(conversation: Conversation): Observable<Conversation> {
    return BrowserStorage.getData(UIStorageKeys.ConversationHistory, []).pipe(
      map((conversations: Conversation[]) => {
        BrowserStorage.setData(
          UIStorageKeys.ConversationHistory,
          conversations.map(conv => (conv.id === conversation.id ? conversation : conv)),
        );
        return conversation;
      }),
    );
  }

  createConversation(conversation: Conversation): Observable<Conversation> {
    return BrowserStorage.getData(UIStorageKeys.ConversationHistory, []).pipe(
      map((conversations: Conversation[]) => {
        BrowserStorage.setData(UIStorageKeys.ConversationHistory, [...conversations, conversation]);
        return conversation;
      }),
    );
  }

  public static getData<K = undefined>(key: UIStorageKeys, defaultValue: K): Observable<K> {
    try {
      const value = this.storage!.getItem(key);
      return of(value === null || value === undefined ? defaultValue : JSON.parse(value));
    } catch (e: unknown) {
      console.error(e);
      if ((e as Error).name === 'QuotaExceededError') {
        console.error(errorsMessages.localStorageQuotaExceeded);
      }
      return of(defaultValue);
    }
  }

  public static setData<K = unknown>(key: UIStorageKeys, value: K): Observable<void> {
    try {
      this.storage!.setItem(key, JSON.stringify(value));
      return of(undefined);
    } catch (e: unknown) {
      console.error(e);
      if ((e as Error).name === 'QuotaExceededError') {
        console.error(errorsMessages.localStorageQuotaExceeded);
        return of(undefined);
      } else {
        return throwError(() => e);
      }
    }
  }
}
