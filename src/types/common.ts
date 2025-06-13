import { Graph } from './graph';
import { Sources } from './sources';

export enum EntityType {
  Model = 'model',
}

export enum FeatureType {
  Chat = 'chat',
  Prompt = 'prompt',
  File = 'file',
  Application = 'application',
}

export enum UploadStatus {
  UNINITIALIZED = 'UNINITIALIZED',
  LOADING = 'UPLOADING',
  LOADED = 'LOADED',
  FAILED = 'FAILED',
  ALL_LOADED = 'ALL_LOADED',
}

export interface Entity {
  id: string;
  name: string;
  status?: UploadStatus;
  folderId?: string;
}

export enum ApiKeys {
  Conversations = 'conversations',
  Files = 'files',
  Applications = 'applications',
  Test = 'test', // For testing purposes
}

export enum BackendResourceType {
  FILE = 'FILE',
  PROMPT = 'PROMPT',
  CONVERSATION = 'CONVERSATION',
  APPLICATION = 'APPLICATION',
}

export interface BackendDataEntity {
  nodeType: BackendDataNodeType;
  name: string;
  resourceType: BackendResourceType;
  bucket: string;
  parentPath?: string | null;
  url: string;
}

export interface BackendEntity extends BackendDataEntity {
  nodeType: BackendDataNodeType.ITEM;
}

export interface BaseDialEntity {
  // Combination of relative path and name
  id: string;
  // Only for files fetched uploaded to backend
  // Same as relative path but has some absolute prefix like <HASH>
  absolutePath?: string;
  relativePath?: string;
  // Same as relative path, but needed for simplicity and backward compatibility
  folderId: string;
  serverSynced?: boolean;
  status?: UploadStatus.LOADING | UploadStatus.FAILED;
}

export enum BackendDataNodeType {
  ITEM = 'ITEM',
  FOLDER = 'FOLDER',
}

export interface BackendChatEntity extends BackendEntity {
  updatedAt: number;
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export enum Platform {
  MAC = 'mac',
  WINDOWS = 'windows',
  OTHER = 'other',
}

export enum PublishActions {
  ADD = 'ADD',
  DELETE = 'DELETE',
  ADD_IF_ABSENT = 'ADD_IF_ABSENT',
}

export interface EntityPublicationInfo {
  action?: PublishActions;
  isNotExist?: boolean;
  version?: string;
  versionGroup?: string;
}

export interface ShareInterface {
  isShared?: boolean;
  sharedWithMe?: boolean;

  isPublished?: boolean;
  publishedWithMe?: boolean;
  publicationInfo?: EntityPublicationInfo;
}

export interface ShareEntity extends Entity, ShareInterface {}

export interface CaptchaToken {
  captchaToken?: string;
}

export type HistoryActionTypes = 'undo' | 'redo';

export interface UndoRedo {
  undo: boolean;
  redo: boolean;
}

export interface ExtendedUndoRedo extends UndoRedo {
  sources?: Sources;
  graph?: Graph;
}
