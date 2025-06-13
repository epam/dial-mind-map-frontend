import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const updateNodeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; node: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);

  try {
    const body = await req.json();

    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/graph/nodes/${params.node}`,
      {
        method: HTTPMethod.PUT,
        headers: getApiHeaders({
          authParams: authParams,
          contentType: 'application/json',
          IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
          [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
        }),
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: params.mindmap,
          node: params.node,
        },
        `Error happened during editing mindmap's node`,
      );
      return new NextResponse(errRespText, { status: response.status });
    }

    const headers = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return new NextResponse('Updated', { status: 200, headers });
  } catch (error) {
    logger.error(
      {
        error,
        mindmap: mindmapId,
        node: params.node,
      },
      `Error happened during editing mindmap's node`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const PUT = withLogger(withAuth(updateNodeHandler));
