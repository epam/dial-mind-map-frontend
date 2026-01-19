import { NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const markAsAppliedHandler = async (
  req: Request,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string }> },
) => {
  try {
    const params = await context.params;
    const mindmapId = decodeAppPathSafely(params.mindmap);

    const data = await req.json();
    const response = await fetch(`${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/apply`, {
      method: HTTPMethod.POST,
      body: JSON.stringify(data),
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
        IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
      }),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: mindmapId,
          document,
        },
        `Error happened during marking mindmap's document as applied`,
      );
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, { status: response.status });
    }

    const text = await response.text();

    const headers = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return NextResponse.json(text, {
      status: response.status,
      headers,
    });
  } catch (error) {
    logger.error(
      {
        error,
      },
      `Error happened during marking mindmap's document as applied`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(markAsAppliedHandler));
