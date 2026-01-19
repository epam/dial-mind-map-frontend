import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { AuthParams } from '@/types/api';
import { decodeAppPathSafely } from '@/utils/app/application';
import { getMimeFromFilename } from '@/utils/app/file';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

const CACHE_TIME_IN_SECONDS = 3600; // 1 hour

export const getFileHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: Promise<{ mindmap: string; theme: string; file: string }> },
) => {
  const { mindmap, theme, file } = await params;
  const mindmapId = decodeAppPathSafely(mindmap);
  const searchParams = new URL(req.url).searchParams;

  try {
    const url = `${process.env.DIAL_API_HOST}/v1/deployments/${mindmapId}/route/v1/appearances/themes/${theme}/storage/${file}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders({
        authParams: authParams,
      }),
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          status: response.status,
          responseText: errRespText,
        },
        `Error occurred while fetching file: ${url}`,
      );

      if (response.status === 401) {
        return new NextResponse(errorsMessages.unauthorized, { status: 401 });
      }

      return new NextResponse(errorsMessages.getDocumentsFailed, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || getMimeFromFilename(file);
    const contentDisposition = response.headers.get('Content-Disposition') || 'attachment';

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
      'Cache-Control': `public, max-age=${CACHE_TIME_IN_SECONDS}`,
    });

    // Adjust SVG current color for mindmap node
    const isSvg = contentType && contentType.includes('image/svg+xml');
    const currentColor = searchParams.get('currentColor');

    if (isSvg && currentColor) {
      try {
        let svgContent = await response.text();
        svgContent = svgContent.replace(/currentColor/g, decodeURIComponent(currentColor));

        return new NextResponse(svgContent, { headers, status: response.status });
      } catch (svgError) {
        logger.error({ error: svgError }, 'Failed to process SVG content for currentColor adjustment.');
        return new NextResponse(errorsMessages.generalServer, { status: 500 });
      }
    }

    try {
      const buffer = await response.arrayBuffer();

      return new NextResponse(Buffer.from(buffer), {
        status: response.status,
        headers,
      });
    } catch (bufferError) {
      logger.error({ error: bufferError }, 'Failed to process file as array buffer.');
      return new NextResponse(errorsMessages.generalServer, { status: 500 });
    }
  } catch (error) {
    logger.error(
      { error: error },
      `Internal error occurred while fetching file /mindmaps/${mindmapId}/sources/${theme}/storage/${file}`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
