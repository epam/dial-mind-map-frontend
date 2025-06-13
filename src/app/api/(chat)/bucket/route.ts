import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const getBucketHandler = async (req: NextRequest, authParams: AuthParams) => {
  try {
    const url = `${process.env.DIAL_API_HOST}/v1/bucket`;

    const headers = getApiHeaders({ authParams: authParams });

    const response = await fetch(url, {
      headers: headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'RefreshAccessTokenError' }, { status: 401 });
      }
      const serverErrorMessage = await response.text();
      throw new DialAIError(serverErrorMessage, '', '', response.status + '');
    }

    const json = (await response.json()) as { bucket: string };

    return NextResponse.json(json, { status: 200 });
  } catch (error) {
    logger.error('get bucket handler: ', error);
    if (error instanceof DialAIError) {
      return NextResponse.json(
        { error: error.message ?? errorsMessages.generalServer },
        { status: parseInt(error.code, 10) || 500 },
      );
    }
    return NextResponse.json(errorsMessages.generalServer, { status: 500 });
  }
};

export const GET = withLogger(withAuth(getBucketHandler));
