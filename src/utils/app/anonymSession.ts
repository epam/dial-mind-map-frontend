import { cookies } from 'next/headers';

import { AnonymSessionCookieName } from '@/constants/http';
import { AnonymUserSession } from '@/types/http';

import { logger } from '../server/logger';
import { decryptWeb } from './crypt';

export async function handleAnonymSession(
  secretKey: string,
): Promise<{ isRecaptchaRequired: boolean; anonymCsrfToken: string }> {
  const result = {
    isRecaptchaRequired: false,
    anonymCsrfToken: '',
  };

  const encryptedSession = (await cookies()).get(AnonymSessionCookieName)?.value;

  if (!encryptedSession || !secretKey) {
    logger.warn('An anonymous session cookie is required but has not been set');
    return result;
  }

  try {
    const decryptedSession = await decryptWeb(encryptedSession, secretKey);
    const session = decryptedSession as AnonymUserSession;
    result.isRecaptchaRequired = !session.requestQuota || session.requestQuota < 1;
    result.anonymCsrfToken = session.token || '';
  } catch (e) {
    logger.warn('Failed to decrypt session cookie:', e);
  }

  return result;
}
