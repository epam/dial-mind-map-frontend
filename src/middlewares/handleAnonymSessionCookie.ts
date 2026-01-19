import { NextRequest, NextResponse } from 'next/server';

import { AnonymSessionCookieName, AnonymSessionCSRFTokenHeaderName } from '@/constants/http';
import { AnonymUserSession } from '@/types/http';
import { decryptWeb, encryptWeb } from '@/utils/app/crypt';
import { getCsrfToken } from '@/utils/common/csrf';
import { uuidv4 } from '@/utils/common/uuid';

export async function handleAnonymSessionCookie(req: NextRequest, res: NextResponse) {
  if (!process.env.DIAL_API_KEY || !process.env.ANONYM_SESSION_SECRET_KEY) return;

  const anonymSessionSecretKey = process.env.ANONYM_SESSION_SECRET_KEY || '';
  const existingCookie = req.cookies.get(AnonymSessionCookieName);

  let session: AnonymUserSession;

  if (existingCookie) {
    try {
      session = await decryptWeb(existingCookie.value, anonymSessionSecretKey);

      if (!session?.userId || !session?.token) {
        throw new Error('Invalid anonym cookie session payload');
      }
    } catch {
      session = {
        userId: uuidv4(),
        token: getCsrfToken(),
      };
    }
  } else {
    session = {
      userId: uuidv4(),
      token: getCsrfToken(),
    };
  }

  const encrypted = await encryptWeb(JSON.stringify(session), anonymSessionSecretKey);

  res.cookies.set(AnonymSessionCookieName, encrypted, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    partitioned: true,
  });

  if (session?.token) {
    res.headers.set(AnonymSessionCSRFTokenHeaderName, session.token);
  }
}
