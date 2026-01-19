import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { decodeAppPathSafely } from '@/utils/app/application';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const generateMindmapHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: Promise<{ mindmap: string }> },
) => {
  const params = await context.params;
  const mindmapId = decodeAppPathSafely(params.mindmap);

  try {
    const hasBody = req.headers.get('Content-Length') !== '0';

    let body = null;
    if (hasBody) {
      body = await req.json();
    }

    const response = await fetch(`${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/generate`, {
      method: HTTPMethod.POST,
      headers: getApiHeaders({
        authParams: authParams,
      }),
      body: body && JSON.stringify(body),
    });

    if (response.status !== 200) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: mindmapId,
        },
        `Error occurred during generating mindmap`,
      );
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, { status: response.status });
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
    logger.error(
      {
        message: (error as Error).message,
        mindmap: mindmapId,
      },
      `Internal error occurred during generating mindmap`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(generateMindmapHandler));
