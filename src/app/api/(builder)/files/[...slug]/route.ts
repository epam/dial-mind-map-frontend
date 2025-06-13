import { NextRequest, NextResponse } from 'next/server';

import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { HTTPMethod } from '@/types/http';
import { constructPath } from '@/utils/app/file';
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

async function handleGetRequest(req: NextRequest, authParams: AuthParams, context: { params: { slug: string[] } }) {
  const url = getEntityUrlFromSlugs(process.env.DIAL_API_HOST, context.params.slug);
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

  const contentType = proxyRes.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const isSvg = contentType && contentType.includes('image/svg+xml');
  const urlObj = new URL(req.url);
  const currentColor = urlObj.searchParams.get('currentColor');

  if (isSvg && currentColor) {
    let svgContent = await proxyRes.text();
    svgContent = svgContent.replace(/currentColor/g, decodeURIComponent(currentColor));
    return new NextResponse(svgContent, { headers, status: proxyRes.status });
  }

  return new NextResponse(proxyRes.body, { headers, status: proxyRes.status });
}

async function handlePostRequest(req: NextRequest, authParams: AuthParams, context: { params: { slug: string[] } }) {
  const url = getEntityUrlFromSlugs(process.env.DIAL_API_HOST!, context.params.slug);

  const reqHeaders = getApiHeaders({
    authParams: authParams,
    contentType: req.headers.get('content-type') as string,
  });

  const proxyRes = await fetch(url, {
    method: HTTPMethod.PUT,
    headers: reqHeaders,
    body: req.body,
    ...({ duplex: 'half' } as any),
  });

  let json: unknown;
  try {
    json = await proxyRes.json();
  } catch {
    json = undefined;
  }

  if (!proxyRes.ok) {
    throw new DialAIError((typeof json === 'string' && json) || proxyRes.statusText, '', '', proxyRes.status + '');
  }

  return NextResponse.json(json, { status: 200 });
}

async function handleDeleteRequest(req: NextRequest, authParams: AuthParams, context: { params: { slug: string[] } }) {
  const url = getEntityUrlFromSlugs(process.env.DIAL_API_HOST!, context.params.slug);

  const reqHeaders = getApiHeaders({
    authParams: authParams,
  });

  const proxyRes = await fetch(url, {
    method: HTTPMethod.DELETE,
    headers: reqHeaders,
  });

  if (!proxyRes.ok) {
    let json: unknown;
    try {
      json = await proxyRes.json();
    } catch {
      json = undefined;
    }

    throw new DialAIError((typeof json === 'string' && json) || proxyRes.statusText, '', '', proxyRes.status + '');
  }

  return new NextResponse(proxyRes.statusText, { status: proxyRes.status });
}

export const GET = withLogger(withAuth(handleGetRequest));
export const POST = withLogger(withAuth(handlePostRequest));
export const DELETE = withLogger(withAuth(handleDeleteRequest));
