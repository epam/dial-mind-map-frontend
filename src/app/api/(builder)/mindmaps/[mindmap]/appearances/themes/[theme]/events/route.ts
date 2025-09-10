import { NextRequest, NextResponse } from 'next/server';

import { defaultConfig } from '@/constants/appearances/defaultConfig';
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
  { params }: { params: { mindmap: string; theme: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);
  const themeId = params.theme;
  let isStreamClosed = false;

  try {
    const controller = new AbortController();
    req.signal.addEventListener('abort', () => {
      logger.info('Client disconnected, aborting backend fetch');
      controller.abort();
    });

    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/appearances/themes/${themeId}/events`,
      {
        method: HTTPMethod.POST,
        headers: getApiHeaders({
          authParams: authParams,
          contentType: 'application/json',
          [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
        }),
        signal: controller.signal,
      },
    );

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
            let mergedMessage = null;
            if (rawMessage.startsWith('data:')) {
              const jsonData = rawMessage.slice(5).trim();
              let parsedData;
              try {
                parsedData = JSON.parse(jsonData);
              } catch (error) {
                logger.error({ error: error }, 'Failed to parse JSON data from theme subscription');
              }
              if (parsedData) {
                const defaultThemeConfig = process.env.THEMES_CONFIG
                  ? JSON.parse(process.env.THEMES_CONFIG)
                  : defaultConfig;
                const themeConfig = defaultThemeConfig[themeId] || {};
                const mergedData = { ...themeConfig, ...parsedData };
                const mergedString = JSON.stringify(mergedData);
                mergedMessage = 'data: ' + mergedString;
              }
            }
            buffer = buffer.slice(position + 2);

            await writer.write(encoder.encode(`${mergedMessage ?? rawMessage}\n\n`));
            await writer.ready;
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          logger.error({ error: error }, 'Error receiving theme subscription event');
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                error: 'Error receiving theme subscription event',
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
      logger.info('Theme subscription client disconnected');
      try {
        await reader.cancel();
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          logger.error({ error: error }, 'Error cancelling theme subscription reader');
        }
      }
      if (!isStreamClosed) {
        isStreamClosed = true;
        try {
          await writer.close();
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            logger.error({ error: error }, 'Error closing theme subscription writer');
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
      logger.error(
        { err: error },
        `Internal error happened during receiving updates for the theme ${themeId} of mindmap ${mindmapId}`,
      );
    }
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(subscribeHandler));
