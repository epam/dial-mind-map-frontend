import { NextRequest, NextResponse } from 'next/server';

import { handleAnonymSessionCookie } from './middlewares/handleAnonymSessionCookie';
import { handleChatAppCookie } from './middlewares/handleChatAppCookie';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith('/chat')) {
    await handleAnonymSessionCookie(req, res);
    await handleChatAppCookie(req, res);
    res.headers.set('x-playback', req.nextUrl.searchParams.get('playback') || 'false');
    const authMode = req.nextUrl.searchParams.get('authMode');
    if (authMode) {
      res.headers.set('x-auth-mode', authMode);
    }
  }

  if (req.nextUrl.pathname.startsWith('/signin')) {
    res.headers.set('x-url', req.url);
  }

  return res;
}

export const config = {
  matcher: ['/chat/:path*', '/signin'],
};
