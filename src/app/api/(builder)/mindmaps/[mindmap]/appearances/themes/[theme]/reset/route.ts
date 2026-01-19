import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { defaultConfig } from '@/constants/appearances/defaultConfig';
import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { ThemeConfig } from '@/types/customization';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const resetThemeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: Promise<{ mindmap: string; theme: string }> },
) => {
  const { mindmap, theme: themeId } = await params;
  const mindmapId = decodeAppPathSafely(mindmap);

  const themes = process.env.THEMES_CONFIG;
  let themesConfig: Record<string, ThemeConfig> | undefined;
  try {
    themesConfig = themes ? (JSON.parse(themes) as Record<string, ThemeConfig>) : defaultConfig;
  } catch (error) {
    logger.error({ error: error }, `Failed to parse themes config from environment variable THEMES_CONFIG`);
    throw new Error(`Failed to parse themes config from environment variable THEMES_CONFIG`);
  }
  const defaultThemeConfig = themesConfig[themeId] || {};

  try {
    const response = await fetch(
      `${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/appearances/themes/${themeId}`,
      {
        method: HTTPMethod.POST,
        headers: getApiHeaders({
          authParams,
          contentType: 'application/json',
          IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
        }),
        body: JSON.stringify(defaultThemeConfig),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logger.warn(
        { status: response.status, response: errorBody },
        `Error resetting theme ${themeId} for mindmap ${mindmapId}`,
      );
      return new NextResponse(errorBody, { status: response.status });
    }

    const headers = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }
    return NextResponse.json(defaultThemeConfig, { status: 200, headers });
  } catch (error) {
    logger.error({ error }, `Internal error during resetting theme ${themeId} for mindmap ${mindmapId}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(resetThemeHandler));
