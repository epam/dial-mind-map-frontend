import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';

import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { validateServerSession } from '@/utils/auth/session';

import { logger } from '../server/logger';
import { nextauthOptions } from './auth-callbacks';

export function withAuth<T = unknown>(
  handler: (req: NextRequest, authParams: AuthParams, context: T) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context: T) => {
    const session = await getServerSession(nextauthOptions);
    if (!validateServerSession(session) && !process.env.ALLOW_API_KEY_AUTH) {
      logger.warn(`Invalid session:`, session?.user?.email);
      return NextResponse.json({ error: session?.error ?? 'RefreshAccessTokenError' }, { status: 401 });
    }

    const token = await getToken({ req });
    if (!token && !process.env.ALLOW_API_KEY_AUTH) {
      logger.warn(`Invalid token`);
      return NextResponse.json({ error: 'RefreshAccessTokenError' }, { status: 401 });
    }

    if (process.env.ALLOW_API_KEY_AUTH && !process.env.DIAL_API_KEY) {
      logger.warn(`API key is not set`);
      return NextResponse.json({ error: 'API key is not set' }, { status: 401 });
    }

    const authParams = { token: token, apiKey: process.env.DIAL_API_KEY };

    try {
      return await handler(req, authParams, context);
    } catch (error) {
      logger.warn(`Error in withAuth middleware:`, error);

      if (error instanceof DialAIError) {
        return NextResponse.json({ error: error.message }, { status: parseInt(error.code, 10) || 500 });
      }

      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
