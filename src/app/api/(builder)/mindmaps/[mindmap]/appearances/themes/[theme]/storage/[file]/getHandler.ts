import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { extname } from 'path';

import { errorsMessages } from '@/constants/errors';
import { MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { getApiHeaders } from '@/utils/server/get-headers';
import { logger } from '@/utils/server/logger';

const mimeTypes = {
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};

const getMimeFromFilename = (filename: string): string => {
  const ext = extname(filename).toLowerCase();
  return mimeTypes[ext as keyof typeof mimeTypes] || 'application/octet-stream';
};

const CACHE_TIME_IN_SECONDS = 3600; // 1 hour

export const getFileHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string; theme: string; file: string } },
) => {
  const mindmapId = decodeURIComponent(params.mindmap);
  const searchParams = new URL(req.url).searchParams;
  const mmFolderPath = searchParams.get('folder');

  if (!mmFolderPath) {
    logger.warn(
      {
        url: req.url,
      },
      'Application folder is empty',
    );
    return new NextResponse(errorsMessages[400], { status: 400 });
  }

  try {
    const url = `${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/appearances/themes/${params.theme}/storage/${params.file}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders({
        authParams: authParams,
        [MindmapUrlHeaderName]: mmFolderPath,
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

    const contentType = response.headers.get('Content-Type') || getMimeFromFilename(params.file);
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
      `Internal error occurred while fetching file /mindmaps/${mindmapId}/sources/${params.theme}/storage/${params.file}`,
    );
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
