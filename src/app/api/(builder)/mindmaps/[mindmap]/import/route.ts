import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

async function handlePost(req: NextRequest, authParams: AuthParams, { params }: { params: { mindmap: string } }) {
  try {
    const mindmapId = decodeURIComponent(params.mindmap);
    const backendUrl = `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/import`;

    const headers = getApiHeaders({
      authParams,
      contentType: req.headers.get('content-type') as string,
      [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
    });

    const proxyRes = await fetch(backendUrl, {
      method: HTTPMethod.POST,
      headers,
      body: req.body,
      ...{ duplex: 'half' },
    });

    if (!proxyRes.ok) {
      const errRespText = await proxyRes.text();
      logger.warn(
        {
          status: proxyRes.status,
          response: errRespText,
          mindmap: mindmapId,
        },
        `Error importing mindmap ${mindmapId}`,
      );
      if (proxyRes.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, { status: proxyRes.status ?? 500 });
    }

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    logger.error({ error: error }, `Internal error happened during importing mindmap ${params.mindmap}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
}

export const POST = withLogger(withAuth(handlePost));
