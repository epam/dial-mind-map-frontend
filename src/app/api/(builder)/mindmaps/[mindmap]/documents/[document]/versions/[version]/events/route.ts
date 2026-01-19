import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const sourceCreationSubscribeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string; document: string; version: string }> },
) => {
  const { document, version, mindmap: encodedMindmapId } = await context.params;
  const mindmapId = decodeAppPathSafely(encodedMindmapId);

  try {
    const controller = new AbortController();
    req.signal.addEventListener('abort', () => {
      controller.abort();
      logger.warn('Client aborted the source version status event connection');
    });

    const response = await fetch(
      `${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/sources/${document}/versions/${version}/events`,
      {
        method: HTTPMethod.POST,
        signal: controller.signal,
        headers: getApiHeaders({
          authParams: authParams,
          contentType: 'application/json',
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      throw new Error(`Failed to connect to SSE: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let closed = false;

    const processStream = async () => {
      try {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();

          if (done || controller.signal.aborted) break;

          buffer += decoder.decode(value, { stream: true });

          logger.info(`Source status event stream: ${buffer}`);

          let position;
          while ((position = buffer.indexOf('\n\n')) !== -1) {
            const rawMessage = buffer.slice(0, position);
            buffer = buffer.slice(position + 2);
            await writer.write(encoder.encode(`${rawMessage}\n\n`));
            await writer.ready;
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          logger.error({ error: error }, 'Error receiving event');
          try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Error receiving event' })}\n\n`));
          } catch (err) {
            // Ignore write-after-close error
            logger.warn({ error: err }, 'Failed to write the error message into the stream');
          }
        }
      } finally {
        if (!closed) {
          closed = true;
          await writer.close();
        }
      }
    };

    // Run stream processing without blocking response
    processStream();

    return new NextResponse(readable, {
      headers: new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      }),
    });
  } catch (error) {
    logger.error({ error: error }, `Error occurred during processing source for mindmap ${encodedMindmapId}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const GET = withLogger(withAuth(sourceCreationSubscribeHandler));
