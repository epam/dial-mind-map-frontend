import { NextRequest, NextResponse } from 'next/server';

import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { getEntityUrlFromSlugs } from '@/utils/server/getEntityUrlFromSlugs';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

async function handleGetRequest(req: NextRequest, authParams: AuthParams, context: { params: { slug: string[] } }) {
  try {
    const url = getEntityUrlFromSlugs(process.env.DIAL_API_HOST!, context.params.slug);

    let proxyRes;
    try {
      proxyRes = await fetch(url, {
        headers: getApiHeaders({
          authParams: authParams,
        }),
      });
      logger.info({ status: proxyRes.status, statusText: proxyRes.statusText }, 'Received response from entity API.');
    } catch (fetchError) {
      logger.error({ error: fetchError, url }, 'Failed to fetch entity API.');
      return NextResponse.json({ error: 'Failed to fetch entity API.' }, { status: 500 });
    }

    if (!proxyRes.ok) {
      const respText = await proxyRes.text();
      logger.error(
        {
          url,
          status: proxyRes.status,
          statusText: proxyRes.statusText,
          responseText: respText,
        },
        'Entity API responded with an error.',
      );
      return NextResponse.json(
        { error: 'Entity API responded with an error.' },
        { status: proxyRes.status, statusText: proxyRes.statusText },
      );
    }

    const headers = new Headers();
    headers.set('transfer-encoding', 'chunked');
    headers.set(
      'Content-Type',
      proxyRes.headers.get('Content-Type') ?? req.headers.get('content-type') ?? 'application/json',
    );

    let json;
    try {
      json = await proxyRes.json();
    } catch (jsonError) {
      logger.error({ error: jsonError }, 'Failed to parse JSON response from entity API.');
      return NextResponse.json({ error: 'Failed to parse JSON response from entity API.' }, { status: 500 });
    }

    return NextResponse.json(json, {
      status: proxyRes.status,
      headers,
    });
  } catch (error) {
    logger.error({ error, context }, 'An error occurred while handling the GET request.');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
