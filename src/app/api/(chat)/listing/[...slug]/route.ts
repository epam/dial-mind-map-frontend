import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { constructPath } from '@/utils/app/file';
import { withAuth } from '@/utils/auth/withAuth';
import { ServerUtils } from '@/utils/server/api';
import { getApiHeaders } from '@/utils/server/get-headers';
import { withLogger } from '@/utils/server/withLogger';

const getEntityUrlFromSlugs = (dialApiHost: string, slugs: string[]): string => {
  if (!slugs || slugs.length === 0) {
    throw new DialAIError(`No conversations path provided`, '', '', '400');
  }

  return constructPath(dialApiHost, 'v1', 'metadata', ServerUtils.encodeSlugs(slugs), '?recursive=true&limit=1000');
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
    const respText = await proxyRes.json();
    throw new DialAIError(
      `Requesting entity failed - '${url}' ${proxyRes.statusText} ${proxyRes.status}. Error: ${respText}`,
      '',
      '',
      proxyRes.status + '',
    );
  }

  const json = (await proxyRes.json()) as { items: Record<string, unknown>[] };

  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  return NextResponse.json(json.items, {
    status: proxyRes.status,
    headers,
  });
}

export const GET = withLogger(withAuth(handleGetRequest));
