import { NextRequest, NextResponse } from 'next/server';

import { ChatAppCookieName } from '@/constants/http';
import { ChatAppCookie } from '@/types/http';

export async function handleChatAppCookie(req: NextRequest, res: NextResponse) {
  const id = req.nextUrl.searchParams.get('id');
  const theme = req.nextUrl.searchParams.get('theme');

  const existing = req.cookies.get(ChatAppCookieName)?.value;
  let appCookie: ChatAppCookie = { id: '', theme: '' };
  let isUpdated = false;

  if (existing) {
    try {
      appCookie = JSON.parse(existing) as ChatAppCookie;
    } catch {
      appCookie = { id: '', theme: '' };
    }
  }

  if (id && appCookie.id !== id) {
    appCookie.id = id;
    isUpdated = true;
  }

  if (appCookie.theme !== theme) {
    appCookie.theme = theme ?? '';
    isUpdated = true;
  }

  if (isUpdated) {
    res.cookies.set(ChatAppCookieName, JSON.stringify(appCookie), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }
}
