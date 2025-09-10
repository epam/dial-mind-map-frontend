import { GenerateParams } from './generate';

export interface Source {
  url: string;
  id?: string;
  status?: SourceStatus;
  status_description?: string;
  type: SourceType;
  content_type?: string;
  tokens?: number;
  created?: number;
  updated?: number;
  copy_url?: string;
  storage_url?: string;
  version?: number;
  in_graph?: boolean;
  active?: boolean;
  name?: string;
}

export interface CreateSource {
  file?: File;
  link?: string;
  sourceId?: string;
  versionId?: number;
}

export interface CreateSourceVersion {
  file?: File;
  link?: string;
  sourceId: string;
}

export interface RecreateSourceVersion extends CreateSourceVersion {
  versionId: number;
}

export enum SourceType {
  LINK = 'LINK',
  FILE = 'FILE',
}

export interface SourcesNames {
  [key: string]: string;
}

export interface Sources {
  sources: Source[];
  names: SourcesNames;
  generation_status: GenerationStatus;
  generated: boolean;
  params?: GenerateParams;
}

export enum SourceStatus {
  FAILED = 'FAILED',
  INDEXED = 'INDEXED',
  INPROGRESS = 'IN_PROGRESS',
  REMOVED = 'REMOVED',
}

export enum GenerationStatus {
  NOT_STARTED = 'NOT_STARTED',
  FINISHED = 'FINISHED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export type SourceEditMode = 'add' | 'edit' | 'rename' | null;
