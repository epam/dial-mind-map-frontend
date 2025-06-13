import { NextRequest, NextResponse } from 'next/server';

import { DeploymentIdHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { ChatBody, Message, Role } from '@/types/chat';
import { withAuth } from '@/utils/auth/withAuth';
import { gerErrorMessageBody, getMessageCustomContent } from '@/utils/server/chat';
import { logger } from '@/utils/server/logger';
import { OpenAIStream } from '@/utils/server/stream';
import { withCaptcha } from '@/utils/server/withCaptcha';
import { withLogger } from '@/utils/server/withLogger';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

export const POST = withLogger(
  withAuth(async (req: NextRequest, authParams: AuthParams) => {
    let body: ChatBody;
    try {
      body = await req.json();
    } catch (err) {
      logger.warn(err, "Can't read JSON body");
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const wrappedHandler = withCaptcha(async (req, context, body) => {
      const { id, messages, prompt, custom_fields } = body as ChatBody;
      const promptToSend = prompt ?? '';

      let messagesToSend: Message[] = messages.map(m => ({
        ...getMessageCustomContent(m),
        role: m.role,
        content: m.content,
      }));
      if (promptToSend.trim()) {
        messagesToSend = [{ role: Role.System, content: promptToSend }, ...messagesToSend];
      }

      try {
        const deploymentId = req.headers.get(DeploymentIdHeaderName) || '';
        const openAIStream = await OpenAIStream({
          messages: messagesToSend,
          chatId: id,
          deploymentId,
          authParams,
          custom_fields,
        });

        const reader = openAIStream.getReader();
        let firstChunk: Uint8Array;
        try {
          const { done, value } = await reader.read();
          if (done) {
            throw new Error('Stream ended prematurely');
          }
          firstChunk = value!;
        } catch (err: any) {
          const status = err.code && !isNaN(+err.code) ? +err.code : 500;
          return NextResponse.json({ error: err.message }, { status });
        }

        const readableStream = new ReadableStream<Uint8Array>({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(firstChunk!);
            (async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  controller.enqueue(value!);
                }
                controller.close();
              } catch (error) {
                console.error('Stream error:', error);
                try {
                  const errorResponse = gerErrorMessageBody({
                    error,
                    msg: 'Error during stream reading',
                    isStreamingError: true,
                  });
                  const eventStr = `event: error` + `data: ${JSON.stringify(errorResponse)}`;
                  controller.enqueue(encoder.encode(eventStr));
                } catch {
                  const fallback = { error: (error as Error).message };
                  controller.enqueue(encoder.encode(`event: error` + `data: ${JSON.stringify(fallback)}`));
                }
                controller.close();
              }
            })();
          },
          cancel() {
            reader.cancel();
          },
        });

        return new NextResponse(readableStream, {
          headers: SSE_HEADERS,
        });
      } catch (error: any) {
        const status = error.code && !isNaN(+error.code) ? +error.code : 500;
        return NextResponse.json({ error: error.message }, { status });
      }
    });

    return wrappedHandler(req, authParams, body);
  }),
);
