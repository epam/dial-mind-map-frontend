import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import { JWT } from 'next-auth/jwt';
import fetch, { Response } from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { CustomFields, Message } from '@/types/chat';
import { DialAIError } from '@/types/error';

import { getApiHeaders } from './get-headers';

interface DialAIErrorResponse extends Response {
  error?: {
    message: string;
    type: string;
    param: string;
    code: string;

    // Message for end user
    display_message: string | undefined;
  };
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const appendChunk = <T extends object>(stream: ReadableStreamDefaultController, obj: T) => {
  const text = JSON.stringify(obj);
  const queue = encoder.encode(text + '\0');

  stream.enqueue(queue);
};

export const OpenAIStream = async ({
  messages,
  chatId,
  deploymentId,
  authParams,
  custom_fields,
}: {
  messages: Message[];
  chatId: string;
  deploymentId: string;
  authParams: { token: JWT | null; apiKey?: string | undefined };
  custom_fields?: CustomFields;
}) => {
  const url = `${process.env.DIAL_API_HOST}/openai/deployments/${deploymentId}/chat/completions`;

  const requestHeaders = getApiHeaders({
    chatId,
    authParams,
    contentType: 'application/json',
  });

  let body: any;
  let res: Response;
  do {
    body = {
      messages: messages,
      stream: true,
    };

    if (custom_fields) {
      body.custom_fields = custom_fields;
    }

    res = await fetch(url, {
      headers: requestHeaders,
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.status !== 200) {
      let result: DialAIErrorResponse;
      try {
        result = (await res.json()) as DialAIErrorResponse;
      } catch {
        throw new DialAIError(`Chat Server error: ${res.statusText}`, '', '', res.status + '');
      }

      if (result.error) {
        throw new DialAIError(
          result.error.message ?? '',
          result.error.type ?? '',
          result.error.param ?? '',
          result.error.code ?? res.status.toString(10),
          result.error.display_message,
        );
      } else {
        throw new Error(`Core API returned an error: ${JSON.stringify(result, null, 2)}`);
      }
    }

    break;
  } while (true);

  let idSend = false;
  let isFinished = false;
  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (isFinished) {
          return;
        }

        if (event.type === 'event') {
          try {
            if (event.data === '[DONE]') {
              controller.close();
              isFinished = true;
              return;
            }
            const data = event.data;
            const json = JSON.parse(data);
            if (json.error) {
              throw new DialAIError(
                json.error.message,
                json.error.type,
                json.error.param,
                json.error.code,
                json.error.display_message,
              );
            }
            if (!idSend) {
              appendChunk(controller, { responseId: json.id });
              idSend = true;
            }

            if (json.choices?.[0].delta) {
              if (json.choices[0].finish_reason === 'content_filter') {
                throw new DialAIError(errorsMessages.contentFiltering, '', '', 'content_filter');
              }

              appendChunk(controller, json.choices[0].delta);
            }
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      if (res.body) {
        for await (const chunk of res.body) {
          if (isFinished) {
            return;
          }
          parser.feed(decoder.decode(chunk as Buffer));
        }
      }
    },
  });

  return stream;
};
