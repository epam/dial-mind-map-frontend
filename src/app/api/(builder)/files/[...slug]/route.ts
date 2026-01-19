import { NextRequest, NextResponse } from 'next/server';

import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { constructPath, getMimeFromFilename } from '@/utils/app/file';
import { withAuth } from '@/utils/auth/withAuth';
import { ServerUtils } from '@/utils/server/api';
import { getApiHeaders } from '@/utils/server/get-headers';
import { withLogger } from '@/utils/server/withLogger';

const getEntityUrlFromSlugs = (dialApiHost: string, slugs: string[]): string => {
  if (!slugs || slugs.length === 0) {
    throw new DialAIError(`No files path provided`, '', '', '400');
  }

  return constructPath(dialApiHost, 'v1', 'files', ServerUtils.encodeSlugs(slugs));
};

async function handleGetRequest(
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ slug: string[] }> },
) {
  const params = await context.params;
  const url = getEntityUrlFromSlugs(process.env.DIAL_API_HOST, params.slug);
  const reqHeaders = getApiHeaders({ authParams: authParams });
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

  const originalContentType = proxyRes.headers.get('content-type');

  if (!originalContentType || originalContentType === 'application/octet-stream') {
    headers.set('content-type', getMimeFromFilename(params.slug.at(-1) ?? ''));
  } else {
    headers.set('content-type', originalContentType);
  }
  headers.set('Content-Disposition', proxyRes.headers.get('Content-Disposition') || 'attachment');

  const isSvg = headers.get('content-type')?.includes('image/svg+xml') ?? false;
  const urlObj = new URL(req.url);
  const currentColor = urlObj.searchParams.get('currentColor');

  if (isSvg && currentColor) {
    let svgContent = await proxyRes.text();
    svgContent = svgContent.replace(/currentColor/g, decodeURIComponent(currentColor));
    return new NextResponse(svgContent, { headers, status: proxyRes.status });
  }

  return new NextResponse(proxyRes.body, { headers, status: proxyRes.status });
}

export const GET = withLogger(withAuth(handleGetRequest));
