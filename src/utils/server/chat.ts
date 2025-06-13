import { NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { Message, Role } from '@/types/chat';
import { DialAIError } from '@/types/error';

import { logger } from './logger';

export function getMessageCustomContent(message: Message): Partial<Message> | undefined {
  return (
    (message.custom_content?.state || message.custom_content?.attachments) && {
      custom_content: {
        attachments: message.role !== Role.Assistant ? message.custom_content?.attachments : undefined,
        state: message.custom_content?.state,
      },
    }
  );
}

const getResponseBody = (fieldName: string, displayMessage: string | undefined, fallbackMessage: string) => {
  return {
    [fieldName]: displayMessage ? displayMessage : fallbackMessage,
  };
};

export const gerErrorMessageBody = ({
  error,
  msg,
  isStreamingError,
}: {
  error: DialAIError | unknown;
  msg: string;
  isStreamingError?: boolean;
}) => {
  const fieldName = isStreamingError ? 'errorMessage' : 'message';
  let fallbackErrorMessage = errorsMessages.generalServer;
  let statusCode = 500;

  logger.error(error, msg);

  if (error instanceof DialAIError) {
    // Rate limit errors and gateway errors https://platform.openai.com/docs/guides/error-codes/api-errors

    if (['429', '504'].includes(error.code)) {
      fallbackErrorMessage = error.message ?? errorsMessages[429];
      statusCode = 429;
    } else if (error.code === 'content_filter') {
      fallbackErrorMessage = errorsMessages.contentFiltering;
    } else if (['404'].includes(error.code)) {
      statusCode = 404;
      fallbackErrorMessage = errorsMessages[404];
    }
  }

  const responseBody = getResponseBody(
    fieldName,
    error instanceof DialAIError ? error.displayMessage : undefined,
    fallbackErrorMessage,
  );
  return { errorBody: responseBody, status: statusCode };
};

export const chatErrorHandler = ({
  error,
  msg,
  isStreamingError,
}: {
  error: DialAIError | unknown;
  msg: string;
  isStreamingError?: boolean;
}): NextResponse => {
  const postfix = isStreamingError ? '\0' : '';

  const { errorBody, status } = gerErrorMessageBody({ error, msg, isStreamingError });
  return new NextResponse(JSON.stringify(errorBody) + postfix, { status: status ?? 500 });
};
