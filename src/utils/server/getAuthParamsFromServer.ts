import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';

import { AuthParams } from '@/types/api';
import { validateServerSession } from '@/utils/auth/session';

import { nextauthOptions } from '../auth/auth-callbacks';

export async function getAuthParamsFromServer(): Promise<AuthParams> {
  const session = await getServerSession(nextauthOptions);
  const allowApiKey = !!process.env.ALLOW_API_KEY_AUTH;

  if (!validateServerSession(session) && !allowApiKey) {
    throw new Error('Unauthorized: invalid session');
  }

  const cookieHeader = cookies().toString();
  let token = null;

  try {
    // Create a fake request to extract the token from cookies
    // This is necessary because getToken expects a NextRequest object
    const fakeReq = new NextRequest('http://local', { headers: { cookie: cookieHeader } });
    token = await getToken({ req: fakeReq });
  } catch {
    if (!allowApiKey) {
      throw new Error('Unauthorized: missing token');
    }
    token = null;
  }

  if (!token && !allowApiKey) {
    throw new Error('Unauthorized: missing token');
  }

  if (allowApiKey && !process.env.DIAL_API_KEY) {
    throw new Error('API key auth enabled but DIAL_API_KEY is not set');
  }

  return { token, apiKey: process.env.DIAL_API_KEY };
}
