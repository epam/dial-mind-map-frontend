import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HTTPMethod } from '@/types/http';
import { withAuth } from '@/utils/auth/withAuth';
import { extractFontFamilyFromBuffer } from '@/utils/server/font';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';
import { withLogger } from '@/utils/server/withLogger';

const uploadFontFileHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; theme: string; file: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('Missing file', { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let fontFamily: string | undefined;

    try {
      fontFamily = await extractFontFamilyFromBuffer(buffer, file.name);
    } catch (err) {
      logger.warn(
        {
          error: err,
          name: params.file,
        },
        'Font parsing failed',
      );
    }

    const headers = getApiHeaders({
      authParams,
      contentType: undefined,
      IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
      [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
    });

    const response = await fetch(
      `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/appearances/themes/${params.theme}/storage/${encodeURIComponent(params.file)}`,
      {
        method: HTTPMethod.POST,
        headers,
        body: formData as any,
      },
    );

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          status: response.status,
          response: errRespText,
          mindmap: mindmapId,
          theme: params.theme,
          file: params.file,
        },
        `Error happened during uploading mindmap's font file into storage`,
      );
      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }
      return new NextResponse(errRespText, { status: response.status ?? 500 });
    }

    const nextHeaders = new Headers({ 'Content-Type': 'application/json' });

    if (response.headers.has(EtagHeaderName)) {
      nextHeaders.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    return NextResponse.json(
      {
        fontFamily: fontFamily ?? null,
      },
      {
        status: response.status,
        headers: nextHeaders,
      },
    );
  } catch (error) {
    logger.error(
      {
        error,
        mindmap: mindmapId,
        theme: params.theme,
        file: params.file,
      },
      `Internal error happened during uploading mindmap's font file into storage`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};

export const POST = withLogger(withAuth(uploadFontFileHandler));
