import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { AuthParams } from '@/types/api';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleGet(
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string }> },
): Promise<NextResponse> {
  const { mindmap } = await context.params;

  try {
    const mindmapId = decodeAppPathSafely(mindmap);
    const backendUrl = `${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/sources/export`;

    const proxyRes = await fetch(backendUrl, {
      headers: {
        ...getApiHeaders({ authParams }),
        'Accept-Encoding': 'identity',
      },
      cache: 'no-store',
    });

    if (!proxyRes.ok) {
      const text = await proxyRes.text().catch(() => '');
      if (proxyRes.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(text || 'Upstream error', { status: proxyRes.status || 500 });
    }

    const body = proxyRes.body;
    if (!body) return new NextResponse('Upstream has no body', { status: 502 });

    const resHeaders = new Headers();
    for (const [headerKey, headerValue] of proxyRes.headers) {
      const lowerHeaderKey = headerKey.toLowerCase();
      if (
        lowerHeaderKey === 'content-type' ||
        lowerHeaderKey === 'content-disposition' ||
        lowerHeaderKey === 'cache-control' ||
        lowerHeaderKey === 'etag' ||
        lowerHeaderKey === 'last-modified' ||
        lowerHeaderKey === 'accept-ranges'
      ) {
        resHeaders.set(headerKey, headerValue);
      }
    }
    if (!resHeaders.has('content-type')) resHeaders.set('content-type', 'application/zip');
    resHeaders.set('X-Accel-Buffering', 'no');

    return new NextResponse(body, { status: proxyRes.status, headers: resHeaders });
  } catch (e) {
    logger.error(`Error exporting mindmap ${mindmap}:`, e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const GET = withLogger(withAuth(handleGet));
