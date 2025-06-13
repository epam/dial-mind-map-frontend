import { IfMatchHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';

export const getApiHeaders = ({
  chatId,
  authParams,
  contentType,
  ['X-MINDMAP']: X_MINDMAP,
  IfMatch,
}: {
  authParams: AuthParams;
  chatId?: string;
  contentType?: string;
  'X-MINDMAP'?: string;
  IfMatch?: string;
}): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (X_MINDMAP) {
    headers['X-MINDMAP'] = X_MINDMAP;
  }

  if (chatId) {
    headers['X-CONVERSATION-ID'] = encodeURIComponent(chatId.replace(/[\uD800-\uDBFF\uDC00-\uDFFF]+/gm, ''));
  }

  if (!process.env.ALLOW_API_KEY_AUTH && authParams.token?.access_token) {
    headers['authorization'] = 'Bearer ' + authParams.token.access_token;
  }

  if (process.env.ALLOW_API_KEY_AUTH && authParams.apiKey) {
    headers['Api-Key'] = authParams.apiKey;
  }

  if (IfMatch) {
    headers[IfMatchHeaderName] = IfMatch;
  }
  return headers;
};
