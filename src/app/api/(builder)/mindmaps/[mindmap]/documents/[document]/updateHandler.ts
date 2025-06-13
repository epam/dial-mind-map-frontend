import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const updateDocumentHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; document: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);

  try {
    const body = await req.json();

    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/documents/${params.document}`,
      {
        method: HTTPMethod.PUT,
        headers: getApiHeaders({
          authParams: authParams,
          contentType: 'application/json',
          IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
          [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
        }),
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: params.mindmap,
          document: params.document,
        },
        `Error happened during editing mindmap's document`,
      );
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, {
        status: 400,
      });
    }

    const json = await response.json();

    const headers = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return NextResponse.json(json, {
      status: response.status,
      headers,
    });
  } catch (error) {
    logger.error(
      {
        error,
        mindmap: mindmapId,
        document: params.document,
      },
      `Error happened during editing mindmap's document`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
