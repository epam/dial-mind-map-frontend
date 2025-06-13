import { NextRequest, NextResponse } from 'next/server';

import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { constructPath } from '@/utils/app/file';
import { withAuth } from '@/utils/auth/withAuth';
import { ServerUtils } from '@/utils/server/api';
import { getApiHeaders } from '@/utils/server/get-headers';
import { withLogger } from '@/utils/server/withLogger';

const getEntityUrlFromSlugs = (dialApiHost: string, slugs: string[]): string => {
  if (!slugs || slugs.length === 0) {
    throw new DialAIError(`No applications path provided`, '', '', '400');
  }

  return constructPath(dialApiHost, 'v1', 'applications', ServerUtils.encodeSlugs(slugs));
};

async function handleGetRequest(req: NextRequest, authParams: AuthParams, context: { params: { slug: string[] } }) {
  const url = getEntityUrlFromSlugs(process.env.DIAL_API_HOST!, context.params.slug);

  const reqHeaders = getApiHeaders({
    authParams: authParams,
  });

  const proxyRes = await fetch(url, {
    headers: reqHeaders,
  });

  if (!proxyRes.ok) {
    const respText = await proxyRes.text();
    throw new DialAIError(
      `Requesting entity failed - '${url}' ${proxyRes.statusText} ${proxyRes.status}. Error: ${respText}`,
      '',
      '',
      proxyRes.status + '',
    );
  }

  const headers = new Headers();
  headers.set('transfer-encoding', 'chunked');
  headers.set(
    'Content-Type',
    proxyRes.headers.get('Content-Type') ?? req.headers.get('content-type') ?? 'application/json',
  );

  const readableStream = proxyRes.body;
  if (readableStream) {
    return new NextResponse(readableStream, { headers });
  } else {
    return NextResponse.json({}, { headers });
  }
}

async function handlePutRequest(req: NextRequest, authParams: AuthParams, context: { params: { slug: string[] } }) {
  const url = getEntityUrlFromSlugs(process.env.DIAL_API_HOST!, context.params.slug);

  const reqHeaders = getApiHeaders({
    authParams: authParams,
  });
  if (!req.body) {
    throw new DialAIError('No body provided', '', '', '400');
  }

  const body = await req.json();

  const proxyRes = await fetch(url, {
    method: 'PUT',
    headers: reqHeaders,
    body: JSON.stringify(body),
  });

  if (!proxyRes.ok) {
    const respText = await proxyRes.text();
    throw new DialAIError(
      `Updating entity failed - '${url}' ${proxyRes.statusText} ${proxyRes.status}. Error: ${respText}`,
      '',
      '',
      proxyRes.status + '',
    );
  }

  return NextResponse.json({}, { status: 200 });
}

export const GET = withLogger(withAuth(handleGetRequest));
export const PUT = withLogger(withAuth(handlePutRequest));
