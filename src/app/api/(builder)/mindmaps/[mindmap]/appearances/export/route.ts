import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { AuthParams } from '@/types/api';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

async function handleGet(
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: Promise<{ mindmap: string }> },
) {
  const { mindmap } = await params;
  try {
    const mindmapId = decodeAppPathSafely(mindmap);
    const url = `${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/appearances/export`;
    const headers = getApiHeaders({ authParams });
    const proxyRes = await fetch(url, { headers });

    if (!proxyRes.ok) {
      const errRespText = await proxyRes.text();
      logger.warn(
        {
          status: proxyRes.status,
          response: errRespText,
          mindmap: mindmapId,
        },
        `Error exporting appearances for mindmap ${mindmapId}`,
      );
      if (proxyRes.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, { status: proxyRes.status ?? 500 });
    }

    const resHeaders = new Headers(proxyRes.headers);
    resHeaders.delete('content-encoding');
    resHeaders.set('content-type', 'application/zip');

    const contentType = proxyRes.headers.get('Content-Type') || 'application/octet-stream';
    const contentDisposition = proxyRes.headers.get('Content-Disposition') || 'attachment';
    resHeaders.set('Content-Type', contentType);
    resHeaders.set('Content-Disposition', contentDisposition);

    const buffer = await proxyRes.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: proxyRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    logger.error(`Error exporting appearances for mindmap ${mindmap}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const GET = withLogger(withAuth(handleGet));
