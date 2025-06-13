import { from, Observable, switchMap, throwError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { EMPTY_MODEL_ID } from '@/constants/settings';
import { Conversation, ConversationInfo } from '@/types/chat';
import { HTTPMethod } from '@/types/http';

import { constructPath } from '../app/file';

export const pathKeySeparator = '__';
const encodedKeySeparator = '%5F%5F';

export const encodeModelId = (modelId: string): string =>
  modelId
    .split(pathKeySeparator)
    .map(i => encodeURI(i))
    .join(encodedKeySeparator);

export const decodeModelId = (modelKey: string): string =>
  modelKey
    .split(encodedKeySeparator)
    .map(i => decodeURI(i))
    .join(pathKeySeparator);

// Format key: {modelId}__{name} or {modelId}__{name}__{version} if conversation is public
export const getConversationApiKey = (conversation: Omit<ConversationInfo, 'id' | 'folderId'>): string => {
  if (conversation.model.id === EMPTY_MODEL_ID) {
    return conversation.name;
  }

  const keyParts = [encodeModelId((conversation as Conversation).model.id), conversation.name];

  return keyParts.join(pathKeySeparator);
};

// Format key: {modelId}__{name}
export const parseConversationApiKey = (apiKey: string): Omit<ConversationInfo, 'folderId' | 'id'> => {
  const parts = apiKey.split(pathKeySeparator);

  const [modelId, name] =
    parts.length < 2
      ? [EMPTY_MODEL_ID, apiKey] // receive without prefix with model i.e. {name}
      : [decodeModelId(parts[0]), parts.slice(1).join(pathKeySeparator)]; // receive correct format {modelId}__{name}

  const parsedApiKey: Omit<ConversationInfo, 'folderId' | 'id'> = {
    model: { id: modelId },
    name,
  };

  return parsedApiKey;
};

export class ApiUtils {
  static safeEncodeURIComponent = (urlComponent: string) =>
    urlComponent.replace(/[^\uD800-\uDBFF\uDC00-\uDFFF]+/gm, match => encodeURIComponent(match));

  static encodeApiUrl = (path: string): string =>
    constructPath(...path.split('/').map(part => this.safeEncodeURIComponent(part)));

  static decodeApiUrl = (path: string): string =>
    constructPath(...path.split('/').map(part => decodeURIComponent(part)));

  static request(url: string, options?: RequestInit) {
    return fromFetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    }).pipe(
      switchMap(response => {
        if (!response.ok) {
          return from(ServerUtils.getErrorMessageFromResponse(response)).pipe(
            switchMap(errorMessage => {
              return throwError(() => new Error(errorMessage || response.status + ''));
            }),
          );
        }

        return from(response.json());
      }),
    );
  }

  static requestOld({
    url,
    method,
    async,
    body,
  }: {
    url: string | URL;
    method: HTTPMethod;
    async: boolean;
    body: XMLHttpRequestBodyInit | Document | null | undefined;
  }): Observable<{ percent?: number; result?: unknown }> {
    return new Observable(observer => {
      const xhr = new XMLHttpRequest();

      xhr.open(method, url, async);
      xhr.responseType = 'json';

      // Track upload progress
      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          observer.next({ percent: Math.round(percentComplete) });
        }
      };

      // Handle response
      xhr.onload = () => {
        if (xhr.status === 200) {
          observer.next({ result: xhr.response });
          observer.complete();
        } else {
          observer.error('Request failed');
        }
      };

      xhr.onerror = () => {
        observer.error('Request failed');
      };

      xhr.send(body);

      // Return cleanup function
      return () => {
        xhr.abort();
      };
    });
  }
}

export class ServerUtils {
  public static encodeSlugs = (slugs: (string | undefined)[]): string =>
    constructPath(...slugs.filter(Boolean).map(part => ApiUtils.safeEncodeURIComponent(part as string)));

  public static safeDecodeURI = (str: string): string => {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  };

  public static getErrorMessageFromResponse = async (res: Response): Promise<string | null> => {
    try {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return this.safeDecodeURI(typeof json === 'string' ? json : JSON.stringify(json));
      } catch {
        return this.safeDecodeURI(text);
      }
    } catch {
      return null;
    }
  };
}
