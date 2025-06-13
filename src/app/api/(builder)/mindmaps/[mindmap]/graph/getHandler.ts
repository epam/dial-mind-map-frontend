import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const getGraphHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);

  try {
    const response = await fetch(`${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/graph`, {
      method: HTTPMethod.GET,
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
        IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
        [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
      }),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(errRespText, `Error happened during fetching mindmap ${mindmapId}`);
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errorsMessages.getFailed, { status: response.status });
    }

    const json = await response.json();
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return NextResponse.json(json, {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error(error, `Error happened during fetching mindmap ${mindmapId}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
