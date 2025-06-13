import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const deleteGeneratedEdgesHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);

  try {
    const response = await fetch(`${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/graph/edges/auto`, {
      method: HTTPMethod.DELETE,
      headers: getApiHeaders({
        authParams: authParams,
        IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
        [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
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
