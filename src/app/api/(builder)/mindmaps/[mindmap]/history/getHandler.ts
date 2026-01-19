import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const getHistoryHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string }> },
) => {
  const params = await context.params;
  const mindmapId = decodeAppPathSafely(params.mindmap);
  try {
    const response = await fetch(`${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/history`, {
      method: HTTPMethod.GET,
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
      }),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn({ response: errRespText }, `Error happened during fetching history for mindmap ${mindmapId}`);
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errorsMessages.getDocumentsFailed, { status: response.status });
    }

    const json = await response.json();

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    return NextResponse.json(json, {
      status: response.status,
      headers,
    });
  } catch (error) {
    logger.error({ error: error }, `Internal error happened during fetching history for mindmap ${mindmapId}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
