import { NextRequest, NextResponse } from 'next/server';

import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { isAbortError } from '@/utils/common/error';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const subscribeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string }> },
) => {
  const params = await context.params;
  const mindmapId = decodeAppPathSafely(params.mindmap);
  let isStreamClosed = false;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const safeClose = async () => {
    if (!isStreamClosed) {
      isStreamClosed = true;
      try {
        await writer.close();
      } catch (err: any) {
        // Ignore errors caused by already-closed or errored stream
        if (!isAbortError(err) && !err.message.includes('Invalid state')) {
          logger.warn({ error: err }, 'Failed to close stream safely');
        }
      }
    }
  };

  const responseStream = new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });

  // Write initial "connected" message
  writer.write(encoder.encode(`: connected\n\n`));

  const controller = new AbortController();
  req.signal.addEventListener('abort', async () => {
    logger.info('Client disconnected, aborting backend fetch');
    controller.abort();
    await safeClose();
  });

  (async () => {
    try {
      const response = await fetch(`${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/subscribe`, {
        method: HTTPMethod.GET,
        headers: getApiHeaders({
          authParams: authParams,
          contentType: 'application/json',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: response.statusText })}\n\n`));
        await safeClose();
        return;
      }

      const reader = response.body!.getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let pos;
        while ((pos = buffer.indexOf('\n\n')) !== -1) {
          const msg = buffer.slice(0, pos);
          buffer = buffer.slice(pos + 2);
          await writer.write(encoder.encode(`${msg}\n\n`));
        }
      }
    } catch (err: any) {
      if (!isAbortError(err)) {
        logger.error({ error: err }, 'Error in subscription fetch');
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Subscription fetch error' })}\n\n`));
      }
    } finally {
      await safeClose();
    }
  })();

  return responseStream;
};

export const GET = withLogger(withAuth(subscribeHandler));
