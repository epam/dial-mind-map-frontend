import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { withAuth } from '@/utils/auth/withAuth';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const getFileHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  context: { params: { mindmap: string; document: string; version: string } },
) => {
  const { document, version, mindmap: encodedMindmapId } = context.params;
  const mindmapId = decodeURIComponent(encodedMindmapId);

  try {
    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/sources/${document}/versions/${version}/file`,
      {
        method: 'GET',
        headers: getApiHeaders({
          authParams: authParams,
          [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
        }),
      },
    );

    if (!response.ok) {
      const errRespText = await response.text();

      logger.warn(
        { error: errRespText },
        `Error occurred while fetching file mindmaps/${mindmapId}/sources/${document}/versions/${version}/`,
      );

      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }

      return new NextResponse(errorsMessages.getDocumentsFailed, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('Content-Disposition') || 'attachment';

    const buffer = await response.arrayBuffer();

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
    });

    return new NextResponse(Buffer.from(buffer), {
      status: response.status,
      headers,
    });
  } catch (error) {
    logger.error(
      { error: error },
      `Error occurred while fetching file mindmaps/${mindmapId}/sources/${document}/versions/${version}/`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const GET = withLogger(withAuth(getFileHandler));
