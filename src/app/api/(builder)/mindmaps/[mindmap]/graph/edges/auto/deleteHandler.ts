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

const deleteGeneratedEdgesHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string }> },
) => {
  const params = await context.params;
  const mindmapId = decodeAppPathSafely(params.mindmap);

  try {
    const response = await fetch(`${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/graph/edges/auto`, {
      method: HTTPMethod.DELETE,
      headers: getApiHeaders({
        authParams: authParams,
        IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
      }),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: params.mindmap,
        },
        `Error happened during deleting generated mindmap's edges`,
      );
      return new NextResponse(errRespText, { status: response.status });
    }

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return new NextResponse('Deleted', { status: 200, headers });
  } catch (error) {
    logger.error(
      {
        error: error,
        mindmap: mindmapId,
      },
      `Error happened during deleting generated mindmap's edges`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const DELETE = withLogger(withAuth(deleteGeneratedEdgesHandler));
