import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const createDocumentHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; document: string; version: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);

  try {
    const formData = await req.formData();

    const headers = getApiHeaders({
      authParams,
      contentType: undefined,
      IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
      [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
    });

    const url = params.version
      ? `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/sources/${params.document}/versions/${params.version}`
      : params.document
        ? `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/sources/${params.document}/versions`
        : `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/sources`;

    const response = await fetch(url, {
      method: HTTPMethod.POST,
      headers,
      body: formData as any,
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: mindmapId,
          document: params.document,
          version: params.version,
        },
        `Error happened during creating mindmap's document`,
      );
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, { status: response.status ?? 500 });
    }

    const json = await response.json();

    const nextHeaders = new Headers({
      'Content-Type': 'application/json',
    });

    if (response.headers.has(EtagHeaderName)) {
      nextHeaders.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return NextResponse.json(json, {
      status: response.status,
      headers: nextHeaders,
    });
  } catch (error) {
    logger.error(
      {
        error,
        mindmap: mindmapId,
        document: params.document,
        version: params.version,
      },
      `Internal error happened during creating mindmap's document`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
