import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { DialAIError } from '@/types/error';
import { HTTPMethod } from '@/types/http';
import { constructPath } from '@/utils/app/file';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

export const deleteDocumentHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; document: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);
  const mindmapFolder = req.headers.get(MindmapUrlHeaderName);
  const fileName = new URL(req.url).searchParams.get('fileName');
  if (fileName && mindmapFolder) {
    const url = constructPath(process.env.DIAL_API_HOST!, 'v1', mindmapFolder, 'sources', fileName);
    const reqHeaders = getApiHeaders({
      authParams: authParams,
    });

    const proxyRes = await fetch(url, {
      method: HTTPMethod.DELETE,
      headers: reqHeaders,
    });

    if (!proxyRes.ok) {
      let json: unknown;
      try {
        json = await proxyRes.json();
      } catch {
        json = undefined;
      }

      if (proxyRes.status !== 404) {
        throw new DialAIError((typeof json === 'string' && json) || proxyRes.statusText, '', '', proxyRes.status + '');
      }
    }
  }

  try {
    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/sources/${params.document}`,
      {
        method: HTTPMethod.DELETE,
        headers: getApiHeaders({
          authParams: authParams,
          contentType: 'application/json',
          IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
          [MindmapUrlHeaderName]: mindmapFolder ?? undefined,
        }),
      },
    );

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: mindmapId,
          document: params.document,
        },
        `Error happened during deleting mindmap's document`,
      );
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, { status: response.status });
    }

    const headers = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return new NextResponse('Deleted', { status: response.status, headers });
  } catch (error) {
    logger.error(
      {
        error,
        mindmap: mindmapId,
        document: params.document,
      },
      `Error happened during deleting mindmap's document`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
