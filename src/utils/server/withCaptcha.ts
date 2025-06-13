import { NextRequest, NextResponse } from 'next/server';

import {
  AnonymSessionCookieName,
  AnonymSessionCSRFTokenHeaderName,
  RecaptchaRequiredHeaderName,
} from '@/constants/http';
import { CaptchaToken } from '@/types/common';
import { AnonymUserSession } from '@/types/http';

import { getCsrfToken } from '../common/csrf';
import { decryptNode, encryptNode } from './crypt';
import { logger } from './logger';
import { RecaptchaValidator } from './recaptchaValidator';

export function withCaptcha<T = unknown>(handler: (req: NextRequest, context: T, body: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context: T, body: any) => {
    if (!process.env.ALLOW_API_KEY_AUTH) {
      return await handler(req, context, body);
    }

    const ANONYM_SESSION_SECRET_KEY = process.env.ANONYM_SESSION_SECRET_KEY ?? '';
    const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY ?? '';
    const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY ?? '';
    const RECAPTCHA_REQUEST_QUOTA = process.env.RECAPTCHA_REQUEST_QUOTA
      ? Number(process.env.RECAPTCHA_REQUEST_QUOTA)
      : 1;

    const sessionCookie = req.cookies.get(AnonymSessionCookieName);

    if (!sessionCookie) {
      logger.debug('User session cookie not received');
      return NextResponse.json({ error: 'Failed. Session not found.' }, { status: 400 });
    }

    let decrypted = '';
    try {
      decrypted = decryptNode(sessionCookie.value, ANONYM_SESSION_SECRET_KEY) ?? '';
    } catch (error) {
      logger.error(
        {
          error: error,
          value: sessionCookie.value,
        },
        `Error happened during session cookie decryption`,
      );
    }

    if (!decrypted) {
      logger.debug("User session cookie isn't correct. Can't decrypt.");
      return NextResponse.json({ error: 'Failed. Invalid session.' }, { status: 400 });
    }

    const session = JSON.parse(decrypted) as AnonymUserSession;
    const userId = session.userId;

    if (!userId) {
      logger.debug("User session cookie isn't correct");
      return NextResponse.json({ error: 'Failed. Invalid user.' }, { status: 400 });
    }

    const token = req.headers.get(AnonymSessionCSRFTokenHeaderName);

    if (session.token && session.token !== token) {
      logger.warn(
        {
          isCookieTokenMatch: session.token === token,
        },
        "CSRF token doesn't match",
      );
      return NextResponse.json({ error: 'Failed. Invalid security token.' }, { status: 400 });
    }

    const newCsrfToken = getCsrfToken();
    session.token = newCsrfToken;

    let shouldSetRecaptchaRequiredHeader = false;

    const { captchaToken } = body as CaptchaToken;

    if (captchaToken && RECAPTCHA_SECRET_KEY) {
      const validator = new RecaptchaValidator(RECAPTCHA_SECRET_KEY);
      const isTokenValid = await validator.validateToken(captchaToken);

      if (!isTokenValid) {
        return NextResponse.json({ error: 'Failed. Invalid captcha token.' }, { status: 400 });
      }

      session.requestQuota = RECAPTCHA_REQUEST_QUOTA - 1;
    } else if (session.requestQuota && session.requestQuota > 0) {
      session.requestQuota -= 1;

      if (session.requestQuota === 0) {
        shouldSetRecaptchaRequiredHeader = true;
      }
      // Check recaptchaV2SiteKey for local development hack
    } else if (RECAPTCHA_SITE_KEY) {
      logger.warn(
        {
          hasCaptchaToken: !!captchaToken,
          hasRequestQuota: !!session.requestQuota,
          hitRequestLimit: !!session.requestQuota && session.requestQuota < 1,
        },
        'Empty captcha token and request quota',
      );
      return NextResponse.json({ error: 'Failed. Request quota exceeded.' }, { status: 400 });
    }

    try {
      const response = await handler(req, context, body);

      response.headers.set(AnonymSessionCSRFTokenHeaderName, newCsrfToken);

      if (shouldSetRecaptchaRequiredHeader) {
        response.headers.set(RecaptchaRequiredHeaderName, 'true');
      }

      const encryptedSession = encryptNode(JSON.stringify(session), ANONYM_SESSION_SECRET_KEY);
      response.cookies.set(AnonymSessionCookieName, encryptedSession, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });

      return response;
    } catch (error) {
      logger.warn(`Error in withCaptcha middleware:`, error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
