import { NextRequest, NextResponse } from 'next/server';

import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { decodeAppPathSafely } from '@/utils/app/application';
import { getMimeFromFilename } from '@/utils/app/file';
import { ServerUtils } from '@/utils/server/api';
import { getApiHeaders } from '@/utils/server/get-headers';

export const getIconHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string; slug: string[] }> },
) => {
  const params = await context.params;
  const mindmapId = decodeAppPathSafely(params.mindmap);

  const url = `${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/sources/${ServerUtils.encodeSlugs(params.slug)}`;

  const reqHeaders = getApiHeaders({ authParams });
  delete reqHeaders['accept-encoding'];

  const proxyRes = await fetch(url, { headers: reqHeaders });

  if (!proxyRes.ok) {
    const respText = await proxyRes.text();
    throw new DialAIError(
      `Requesting entity failed - '${url}' ${proxyRes.statusText} ${proxyRes.status}. Error: ${respText}`,
      '',
      '',
      proxyRes.status.toString(),
    );
  }

  const headers = new Headers(proxyRes.headers);
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');

  headers.set('Cache-Control', 'public, max-age=3600, immutable');

  const originalContentType = proxyRes.headers.get('content-type');

  if (!originalContentType || originalContentType === 'application/octet-stream') {
    headers.set('content-type', getMimeFromFilename(params.slug.at(-1) ?? ''));
  } else {
    headers.set('content-type', originalContentType);
  }

  headers.set('Content-Disposition', proxyRes.headers.get('Content-Disposition') || 'attachment');

  return new NextResponse(proxyRes.body, { headers, status: proxyRes.status });
};
