import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const generationStatusHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: { mindmap: string } },
) => {
  const mindmapId = decodeURIComponent(context.params.mindmap);
  try {
    const response = await fetch(`${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/generation_status`, {
      method: HTTPMethod.POST,
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
        [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
      }),
    });

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

    const processStream = async () => {
      try {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          logger.info(`Generation status event stream: ${buffer}`);

          let position;
          while ((position = buffer.indexOf('\n\n')) !== -1) {
            const rawMessage = buffer.slice(0, position);
            buffer = buffer.slice(position + 2);
            await writer.write(encoder.encode(`${rawMessage}\n\n`));
            await writer.ready;
          }
        }
      } catch (error) {
        logger.error(error, 'Error receiving event');
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Error receiving event' })}\n\n`));
      } finally {
        await writer.close();
      }
    };

    processStream();

    return new NextResponse(readable, {
      headers: new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      }),
    });
  } catch (error) {
    logger.error(error, `Error occurred during generation status for mindmap ${context.params.mindmap}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(generationStatusHandler));
