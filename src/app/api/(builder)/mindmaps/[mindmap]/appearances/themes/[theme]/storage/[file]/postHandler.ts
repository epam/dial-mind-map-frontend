import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const uploadFileHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: Promise<{ mindmap: string; theme: string; file: string }> },
) => {
  const { mindmap, theme, file } = await params;
  const mindmapId = decodeAppPathSafely(mindmap);

  try {
    const formData = await req.formData();

    const headers = getApiHeaders({
      authParams,
      contentType: undefined,
      IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
    });

    const response = await fetch(
      `${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/appearances/themes/${theme}/storage/${encodeURIComponent(file)}`,
      {
        method: HTTPMethod.POST,
        headers,
        body: formData as any,
      },
    );

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          status: response.status,
          response: errRespText,
          mindmap: mindmapId,
          theme,
          file,
        },
        `Error happened during uploading mindmap's file into storage`,
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
        theme,
        file,
      },
      `Internal error happened during uploading mindmap's file into storage`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
