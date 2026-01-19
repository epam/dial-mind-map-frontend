import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const postHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string }> },
) => {
  const params = await context.params;
  const mindmapId = decodeAppPathSafely(params.mindmap);

  try {
    const body = await req.json();

    const response = await fetch(`${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/generate/params`, {
      method: HTTPMethod.POST,
      headers: getApiHeaders({
        authParams,
        contentType: 'application/json',
        IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
      }),
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      const errRespText = text;
      logger.warn(
        { response: errRespText },
        `Error happened during updating generation params for mindmap ${mindmapId}`,
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
    logger.error({ error: error }, `Error happened during updating generation params for mindmap ${mindmapId}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
