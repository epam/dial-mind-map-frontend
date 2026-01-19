import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { DeploymentIdHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { Message } from '@/types/chat';
import { CompletionGraphResponse, Graph } from '@/types/graph';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const getGraphHandler = async (req: NextRequest, authParams: AuthParams) => {
  try {
    const body = await req.json();

    const deploymentId = req.headers.get(DeploymentIdHeaderName);
    const url = `${process.env.DIAL_API_HOST}/openai/deployments/${deploymentId}/chat/completions`;

    const response = await fetch(url, {
      method: HTTPMethod.POST,
      headers: {
        ...getApiHeaders({
          authParams,
          contentType: 'application/json',
        }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(errRespText, `Error happened during fetching mindmap`);
      return new NextResponse(errRespText, { status: response.status });
    }

    const json: any = await response.json();
    const message: Message | null = json?.choices?.[0]?.message;

    if (!message || !message.custom_content?.attachments?.[0]?.data) {
      const errorMessage = 'Unable to parse the graph from the completion response.';
      logger.warn(
        {
          response: json,
        },
        errorMessage,
      );
      return new NextResponse(errorMessage, { status: 500 });
    }

    const subgraph: Graph = JSON.parse(message.custom_content.attachments[0].data);
    const result: CompletionGraphResponse = {
      responseId: json.id,
      graph: subgraph,
    };

    return NextResponse.json(result, {
      status: response.status,
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    });
  } catch (error) {
    logger.error(error, `Error happened during fetching mindmap`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(getGraphHandler));
