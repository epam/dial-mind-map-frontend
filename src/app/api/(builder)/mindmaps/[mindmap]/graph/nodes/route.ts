import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const createNodeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string }> },
) => {
  let body = null;
  const params = await context.params;
  const mindmapId = decodeAppPathSafely(params.mindmap);

  try {
    body = await req.json();

    const response = await fetch(`${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/graph/nodes`, {
      method: HTTPMethod.POST,
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
        IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
      }),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: mindmapId,
          body: body,
        },
        `Error happened during creating mindmap's node`,
      );
      return new NextResponse(errRespText, { status: response.status });
    }

    const json = await response.json();

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return NextResponse.json(json, {
      status: 201,
      headers,
    });
  } catch (error) {
    logger.error(
      {
        error: error,
        mindmap: mindmapId,
        body: body,
      },
      `Internal error happened during creating mindmap's node`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(createNodeHandler));
