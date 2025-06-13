import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { HTTPMethod } from '@/types/http';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const patchGraphHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);

  try {
    const body = await req.json();

    const response = await fetch(`${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/graph`, {
      method: HTTPMethod.PATCH,
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
        IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
        [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
      }),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(errRespText, `Error happened during patching mindmap ${mindmapId}`);
      return new NextResponse(errRespText, { status: response.status });
    }

    const headers = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return new NextResponse('OK', {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error('get bucket handler: ', error);
    if (error instanceof DialAIError) {
      return NextResponse.json(
        { error: error.message ?? errorsMessages.generalServer },
        { status: parseInt(error.code, 10) || 500 },
      );
    }
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
