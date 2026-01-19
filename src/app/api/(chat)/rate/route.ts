import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { DeploymentIdHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { RateBody } from '@/types/chat';
import { DialAIError } from '@/types/error';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const rateMessageHandler = async (req: NextRequest, authParams: AuthParams) => {
  try {
    const body = (await req.json()) as RateBody;

    const { responseId, value, comment } = body;

    if (!responseId) {
      return NextResponse.json(errorsMessages[400], { status: 400 });
    }

    const deploymentId = req.headers.get(DeploymentIdHeaderName);
    const url = `${process.env.DIAL_API_HOST}/v1/${deploymentId}/rate`;

    const response = await fetch(url, {
      method: HTTPMethod.POST,
      headers: getApiHeaders({
        authParams,
      }),
      body: JSON.stringify({
        rate: value,
        responseId,
        ...(comment && { comment }),
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'RefreshAccessTokenError' }, { status: 401 });
      }

      const serverErrorMessage = await response.text();
      throw new DialAIError(serverErrorMessage, '', '', response.status.toString());
    }

    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    logger.error('Failed to rate message:', error);

    if (error instanceof DialAIError) {
      return NextResponse.json(
        { error: error.message ?? errorsMessages.generalServer },
        { status: Number(error.code) || 500 },
      );
    }

    return NextResponse.json(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(rateMessageHandler));
