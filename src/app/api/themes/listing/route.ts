import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { HTTPMethod } from '@/types/http';
import { Theme, ThemesConfig } from '@/types/themes';
import { logger } from '@/utils/server/logger';

let cachedThemes: Theme[] = [];
let cachedThemesExpiration: number | undefined;

async function handler() {
  if (!process.env.THEMES_CONFIG_HOST) {
    return new NextResponse(errorsMessages.customThemesConfigNotProvided, { status: 500 });
  }

  if (cachedThemesExpiration && cachedThemes && cachedThemesExpiration > Date.now()) {
    return new NextResponse(JSON.stringify(cachedThemes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const controller = new AbortController();
  const response = await fetch(`${process.env.THEMES_CONFIG_HOST}/config.json`, {
    method: HTTPMethod.GET,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  });

  if (!response.ok) {
    logger.error(
      `Received error when fetching config file: ${response.status} ${response.statusText} ${await response.text()}`,
    );
    if (response.status === 401) {
      return new NextResponse(errorsMessages.unauthorized, { status: 401 });
    }
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }

  const json = (await response.json()) as ThemesConfig;

  const dayInMs = 86400000;

  cachedThemes = Array.isArray(json.themes) ? json.themes : [];
  cachedThemesExpiration = Date.now() + dayInMs;

  return new NextResponse(JSON.stringify(cachedThemes), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export { handler as GET };
