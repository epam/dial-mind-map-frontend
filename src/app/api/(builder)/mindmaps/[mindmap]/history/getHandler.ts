import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const getHistoryHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);
  try {
    const response = await fetch(`${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/history`, {
      method: HTTPMethod.GET,
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
        [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
      }),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn({ response: errRespText }, `Error happened during fetching history for mindmap ${mindmapId}`);
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errorsMessages.getDocumentsFailed, { status: 400 });
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
