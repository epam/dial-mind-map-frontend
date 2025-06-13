import { Observable } from 'rxjs';

import { Conversation, ConversationInfo } from './chat';
import { Entity } from './common';

export enum StorageKeys {
  Preferences = 'mindmap_builder_preferences',
  UI = 'mindmap_builder_ui',
}

export enum UIStorageKeys {
  ConversationHistory = 'mindmap_chat_conversationHistory',
}

export enum StorageType {
  BrowserStorage = 'browserStorage',
  API = 'api',
}

export interface EntityStorage<TEntityInfo extends Entity, TEntity extends TEntityInfo> {
  getEntity(info: TEntityInfo): Observable<TEntity | null>;

  updateEntity(entity: TEntity): Observable<TEntity>;

  getEntityKey(info: TEntityInfo): string;

  parseEntityKey(key: string): Omit<TEntityInfo, 'folderId' | 'id'>;

  getStorageKey(): string; // e.g. ApiKeys or `conversationHistory`/`prompts` in case of localStorage
}

export interface DialStorage {
  getConversation(info: ConversationInfo): Observable<Conversation | null>;

  getConversations(path?: string, recursive?: boolean): Observable<ConversationInfo[]>;

  updateConversation(conversation: Conversation): Observable<Conversation>;

  createConversation(conversation: Conversation): Observable<Conversation>;
}
