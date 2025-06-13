import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { HTTPMethod } from '@/types/http';
import { ThemesConfig } from '@/types/themes';
import { isAbsoluteUrl } from '@/utils/app/file';
import { logger } from '@/utils/server/logger';

let cachedTheme: ThemesConfig | undefined = undefined;
let cachedThemeExpiration: number | undefined;

const getImageUrl = (theme: ThemesConfig, name: string): string | undefined => {
  return theme.images[name as keyof ThemesConfig['images']];
};

const getImage = async (req: NextRequest, cachedTheme: ThemesConfig, name: string) => {
  const imageUrl = getImageUrl(cachedTheme, name);

  let finalUrl = imageUrl || name;
  if (!isAbsoluteUrl(finalUrl)) {
    finalUrl = `${process.env.THEMES_CONFIG_HOST}/${finalUrl}`;
  }
  const response = await fetch(finalUrl);
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    if (response.status === 401) {
      return new NextResponse(errorsMessages.unauthorized, { status: 401 });
    }
    if (name === 'default-model' || name === 'default-addon') {
      return NextResponse.redirect(`//${req.headers.get('host')}/images/icons/message-square-lines-alt.svg`, 307);
    }
    return new NextResponse('Image not found', { status: 404 });
  }

  return new NextResponse(Buffer.from(await response.arrayBuffer()), {
    status: 200,
    headers: { 'Content-Type': contentType || 'image/png' },
  });
};

async function handler(req: NextRequest, { params }: { params: { name: string } }) {
  try {
    if (!process.env.THEMES_CONFIG_HOST) {
      return new NextResponse(errorsMessages.customThemesConfigNotProvided, { status: 500 });
    }

    const name = params.name;

    if (!name) {
      return new NextResponse('Name parameter not provided for theme image', { status: 500 });
    }

    if (cachedThemeExpiration && cachedTheme && cachedThemeExpiration > Date.now()) {
      return getImage(req, cachedTheme, name);
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
    cachedThemeExpiration = Date.now() + dayInMs;
    cachedTheme = json;

    return getImage(req, cachedTheme, name);
  } catch (e) {
    logger.error(e);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
}

export { handler as GET };
