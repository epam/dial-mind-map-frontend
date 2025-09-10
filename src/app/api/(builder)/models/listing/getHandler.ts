import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

const DIAL_API_VERSION = process.env.DIAL_API_VERSION || '2025-01-01-preview';
const DIAL_API_HOST = process.env.DIAL_API_HOST || '';

export const getModelsHandler = async (req: NextRequest, authParams: AuthParams) => {
  try {
    const url = `${DIAL_API_HOST}/openai/models?api-version=${DIAL_API_VERSION}`;
    const response = await fetch(`${url}`, {
      method: HTTPMethod.GET,
      headers: getApiHeaders({
        authParams: authParams,
        contentType: 'application/json',
      }),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(errRespText, `Failed to fetch models from ${url}`);
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errorsMessages.getFailed, { status: response.status });
    }

    const json = await response.json();
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    // Filter out models that are not supported by the current version
    const filteredModels = json.data.filter((model: any) => {
      return !!model.display_name || !!model.display_version;
    });

    return NextResponse.json(filteredModels ?? [], {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error(error, 'Failed to handle get models request');
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
