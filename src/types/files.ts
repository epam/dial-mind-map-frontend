import { BackendEntity, BaseDialEntity, ShareEntity } from './common';

export type ImageMIMEType = 'image/jpeg' | 'image/png' | string;

export const NodesMIMEType = 'application/vnd.dial.mindmap.graph.v1+json';

export type MIMEType =
  | 'text/markdown'
  | 'text/plain'
  | 'text/html'
  | ImageMIMEType
  | string
  | 'application/vnd.dial.mindmap.graph.v1+json';

export interface BackendFile extends BackendEntity {
  contentLength: number;
  contentType: MIMEType;
}

export type DialFile = Omit<BackendFile, 'path' | 'nodeType' | 'resourceType' | 'bucket' | 'parentPath' | 'url'> &
  BaseDialEntity & {
    percent?: number;
    fileContent?: File;
    isPublicationFile?: boolean;
  } & ShareEntity;
