import { NextRequest, NextResponse } from 'next/server';

import { AnonymSessionCookieName, AnonymSessionCSRFTokenHeaderName, ChatAppCookieName } from '@/constants/http';
import { AnonymUserSession } from '@/types/http';
import { decryptWeb, encryptWeb } from '@/utils/app/crypt';
import { getCsrfToken } from '@/utils/common/csrf';
import { uuidv4 } from '@/utils/common/uuid';

export async function handleAnonymSessionCookie(req: NextRequest, res: NextResponse) {
  const cookie = req.cookies.get(ChatAppCookieName);

  if (!process.env.ALLOW_API_KEY_AUTH) return;

  const anonymSessionSecretKey = process.env.ANONYM_SESSION_SECRET_KEY || '';
  let csrfToken: string | undefined;

  if (!cookie) {
    const userId = uuidv4();
    csrfToken = getCsrfToken();

    const encrypted = await encryptWeb(
      JSON.stringify({
        userId,
        token: csrfToken,
      } as AnonymUserSession),
      anonymSessionSecretKey,
    );

    res.cookies.set(AnonymSessionCookieName, encrypted, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  } else {
    const decrypted = await decryptWeb(cookie.value, anonymSessionSecretKey);
    csrfToken = (decrypted as AnonymUserSession)?.token;
  }

  if (csrfToken) {
    res.headers.set(AnonymSessionCSRFTokenHeaderName, csrfToken);
  }
}
