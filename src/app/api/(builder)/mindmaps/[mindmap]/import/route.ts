import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

async function handlePost(req: NextRequest, authParams: AuthParams, context: { params: Promise<{ mindmap: string }> }) {
  const params = await context.params;
  try {
    const mindmapId = decodeAppPathSafely(params.mindmap);
    const backendUrl = `${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/import`;

    const headers = getApiHeaders({
      authParams,
      contentType: req.headers.get('content-type') as string,
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
