import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { defaultConfig } from '@/constants/appearances/defaultConfig';
import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { ThemeConfig } from '@/types/customization';
import { HTTPMethod } from '@/types/http';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const getThemeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; theme: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);
  const themeId = params.theme;

  try {
    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/appearances/themes/${themeId}`,
      {
        method: HTTPMethod.GET,
        headers: getApiHeaders({
          authParams: authParams,
          contentType: 'application/json',
          [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
        }),
      },
    );

    const themes = process.env.THEMES_CONFIG;

    let themesConfig: Record<string, ThemeConfig> | undefined;
    try {
      themesConfig = themes ? (JSON.parse(themes) as Record<string, ThemeConfig>) : defaultConfig;
    } catch (error) {
      logger.error({ error: error }, `Failed to parse themes config from environment variable THEMES_CONFIG`);
      throw new Error(`Failed to parse themes config from environment variable THEMES_CONFIG`);
    }

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        { response: errRespText },
        `Error happened during fetching theme ${themeId} for mindmap ${mindmapId}`,
      );
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }

      //TODO: need to handle 404 case will be updated in the future
      // If the theme is not found, we return the example theme config
      if (response.status === 404) {
        if (themesConfig && themesConfig[themeId]) {
          const headers = new Headers({
            'Content-Type': 'application/json',
          });

          if (response.headers.has(EtagHeaderName)) {
            headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
          }

          return NextResponse.json(themesConfig[themeId], {
            status: 200,
            headers,
          });
        } else {
          logger.warn(
            { themesConfig, themeId },
            `Theme ${themeId} not found in the THEMES_CONFIG environment variable`,
          );
          return new NextResponse(errorsMessages.getDocumentsFailed, { status: 404 });
        }
      }
      return new NextResponse(errorsMessages.getDocumentsFailed, { status: response.status });
    }

    const json = (await response.json()) as ThemeConfig;

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    const defaultTheme = themesConfig[themeId];

    const mergedTheme = {
      ...defaultTheme,
      ...json,
    };

    return NextResponse.json(mergedTheme, {
      status: response.status,
      headers,
    });
  } catch (error) {
    logger.error({ error: error }, `Internal error happened during fetching theme ${themeId} for mindmap ${mindmapId}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
