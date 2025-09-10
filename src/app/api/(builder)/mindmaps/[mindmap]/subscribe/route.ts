import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const subscribeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);
  let isStreamClosed = false;

  try {
    const controller = new AbortController();
    req.signal.addEventListener('abort', () => {
      logger.info('Client disconnected, aborting backend fetch');
      controller.abort();
    });

    const response = await fetch(`${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/subscribe`, {
      method: HTTPMethod.POST,
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
        [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      throw new Error(`Failed to subscribe: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const processStream = async () => {
      try {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let position;
          while ((position = buffer.indexOf('\n\n')) !== -1) {
            const rawMessage = buffer.slice(0, position);
            buffer = buffer.slice(position + 2);

            await writer.write(encoder.encode(`${rawMessage}\n\n`));
            await writer.ready;
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          logger.error(error, 'Error receiving subscription event');
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                error: 'Error receiving subscription event',
              })}\n\n`,
            ),
          );
        }
      } finally {
        if (!isStreamClosed) {
          isStreamClosed = true;
          await writer.close();
        }
      }
    };

    req.signal.addEventListener('abort', async () => {
      logger.info('Subscription client disconnected');
      try {
        await reader.cancel();
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          logger.error(error, 'Error cancelling subscription reader');
        }
      }
      if (!isStreamClosed) {
        isStreamClosed = true;
        try {
          await writer.close();
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            logger.error(error, 'Error closing subscription writer');
          }
        }
      }
    });

    processStream();

    return new NextResponse(readable, {
      headers: new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      }),
    });
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      logger.error(error, `Error happened during receiving updates for the mindmap ${mindmapId}`);
    }
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(subscribeHandler));
