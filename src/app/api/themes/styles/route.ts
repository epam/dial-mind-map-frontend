import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { HTTPMethod } from '@/types/http';
import { ThemesConfigs } from '@/types/themes';
import { mapDialThemeConfigToStyles } from '@/utils/common/themeUtils';
import { logger } from '@/utils/server/logger';

let cachedTheme = '';
let cachedThemeExpiration: number | undefined;

async function handler() {
  if (!process.env.THEMES_CONFIG_HOST) {
    return new NextResponse(errorsMessages.customThemesConfigNotProvided, { status: 500 });
  }

  if (cachedThemeExpiration && cachedTheme && cachedThemeExpiration > Date.now()) {
    return new NextResponse(cachedTheme, {
      status: 200,
      headers: { 'Content-Type': 'text/css' },
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

  const json = (await response.json()) as ThemesConfigs;

  const dayInMs = 86400000;

  try {
    cachedTheme = mapDialThemeConfigToStyles(json);
    cachedThemeExpiration = Date.now() + dayInMs;

    return new NextResponse(cachedTheme, {
      status: 200,
      headers: { 'Content-Type': 'text/css' },
    });
  } catch (e: unknown) {
    logger.error(`Error happened during parsing theme file: ${(e as Error).message}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
}

export { handler as GET };
