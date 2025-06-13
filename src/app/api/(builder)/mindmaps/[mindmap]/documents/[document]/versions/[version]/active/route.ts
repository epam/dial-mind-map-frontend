import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const activeHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: { mindmap: string; document: string; version: string } },
) => {
  const { document, version, mindmap: encodedMindmapId } = context.params;
  const mindmapId = decodeURIComponent(encodedMindmapId);

  try {
    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/sources/${document}/versions/${version}/active`,
      {
        method: 'POST',
        headers: getApiHeaders({
          authParams: authParams,
          [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
        }),
      },
    );

    const res = await response.text();

    if (!response.ok) {
      logger.warn(res, `Error occurred while changing active version`);

      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }

      return new NextResponse(errorsMessages.getDocumentsFailed, { status: response.status });
    }

    return new NextResponse(res, { status: response.status });
  } catch (error) {
    logger.error(error, `Internal error occurred while changing active version`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(activeHandler));
