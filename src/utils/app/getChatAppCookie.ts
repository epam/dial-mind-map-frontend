import merge from 'lodash-es/merge';
import { cookies } from 'next/headers';

import { ChatAppCookieName } from '@/constants/http';
import { ChatAppCookie } from '@/types/http';

import { logger } from '../server/logger';

export async function getChatAppCookie(): Promise<ChatAppCookie> {
  const defaultValue: ChatAppCookie = { id: '', theme: '' };

  const cookieValue = (await cookies()).get(ChatAppCookieName)?.value;
  if (!cookieValue) return defaultValue;

  try {
    const parsed = JSON.parse(cookieValue) as ChatAppCookie;
    return merge(defaultValue, parsed);
  } catch (error) {
    logger.warn({ err: error, rawCookie: cookieValue }, 'Failed to parse chat app cookie');
    return defaultValue;
  }
}
