import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const updateThemeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; theme: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);
  const themeId = params.theme;

  try {
    const body = await req.json();

    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/appearances/themes/${themeId}`,
      {
        method: HTTPMethod.POST,
        headers: getApiHeaders({
          authParams,
          contentType: 'application/json',
          IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
          [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
        }),
        body: JSON.stringify(body),
      },
    );

    const text = await response.text();

    if (!response.ok) {
      const errRespText = text;
      logger.warn(
        { response: errRespText },
        `Error happened during updating theme ${themeId} for mindmap ${mindmapId}`,
      );
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, { status: response.status ?? 500 });
    }

    const nextHeaders = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      nextHeaders.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return NextResponse.json(text, {
      status: response.status,
      headers: nextHeaders,
    });
  } catch (error) {
    logger.error({ error: error }, `Internal error happened during updating theme ${themeId} for mindmap ${mindmapId}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
