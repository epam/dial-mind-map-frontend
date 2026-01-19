export type ImageMIMEType = 'image/jpeg' | 'image/png' | string;

export const NodesMIMEType = 'application/vnd.dial.mindmap.graph.v1+json';

export type MIMEType =
  | 'text/markdown'
  | 'text/plain'
  | 'text/html'
  | ImageMIMEType
  | string
  | 'application/vnd.dial.mindmap.graph.v1+json';
