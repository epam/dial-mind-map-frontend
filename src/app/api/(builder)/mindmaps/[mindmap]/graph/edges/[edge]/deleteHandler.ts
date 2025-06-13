import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const deleteEdgeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; edge: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);

  try {
    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/graph/edges/${params.edge}`,
      {
        method: HTTPMethod.DELETE,
        headers: {
          ...getApiHeaders({
            authParams: authParams,
            contentType: 'application/json',
            IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
            [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
          }),
        },
      },
    );

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: params.mindmap,
          edge: params.edge,
        },
        `Error happened during deleting mindmap's edge`,
      );
      return new NextResponse(errRespText, { status: response.status });
    }

    const headers = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return new NextResponse('Deleted', { status: 200, headers });
  } catch (error) {
    logger.error(
      {
        error,
        mindmap: mindmapId,
        edge: params.edge,
      },
      `Error happened during deleting mindmap's edge`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const DELETE = withLogger(withAuth(deleteEdgeHandler));
