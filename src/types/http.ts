export enum HTTPMethod {
  CONNECT = 'CONNECT',
  DELETE = 'DELETE',
  GET = 'GET',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
  TRACE = 'TRACE',
}

export enum EventAction {
  UPDATE = 'UPDATE',
}

export interface SubscriptionEventData {
  action: EventAction;
  timestamp: number;
  etag: string;
}

export interface GenerationEventData {
  title: string;
  details?: string;
  etag?: string;
}

export interface AnonymUserSession {
  userId: string;
  token?: string;
  requestQuota?: number;
}

export interface ChatAppCookie {
  theme: string;
  id: string;
}
