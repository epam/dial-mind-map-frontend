import { NextRequest, NextResponse } from 'next/server';

import { errorsMessages } from '@/constants/errors';
import { EtagHeaderName, IfMatchHeaderName, MindmapUrlHeaderName } from '@/constants/http';
import { AuthParams } from '@/types/api';
import { HistoryActionTypes } from '@/types/common';
import { HTTPMethod } from '@/types/http';
import { logError, logger } from '@/utils/server/logger';

import { getApiHeaders } from './get-headers';

export const handleUndoRedo = async (
  req: NextRequest,
  mindmap: string,
  action: HistoryActionTypes,
  authParams: AuthParams,
) => {
  const mindmapId = decodeURIComponent(mindmap);

  try {
    const response = await fetch(`${process.env.MINDMAP_BACKEND_URL}/mindmaps/${mindmapId}/history?action=${action}`, {
      method: HTTPMethod.POST,
      headers: {
        ...getApiHeaders({
          authParams: authParams,
          contentType: 'application/json',
          [MindmapUrlHeaderName]: req.headers.get(MindmapUrlHeaderName) ?? undefined,
          IfMatch: req.headers.get(IfMatchHeaderName) ?? '',
        }),
      },
    });

    if (!response.ok) {
      const errRespText = await response.text();
      logger.warn(
        {
          response: errRespText,
          mindmap: mindmap,
        },
        `Error occurred while ${action}ing the mindmap's state`,
      );
      return new NextResponse(errRespText, { status: 400 });
    }

    const headers = new Headers();
    if (response.headers.has(EtagHeaderName)) {
      headers.set(EtagHeaderName, response.headers.get(EtagHeaderName)!);
    }

    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers });
  } catch (error) {
    logError(error, { mindmap }, `Error occurred while ${action}ing the mindmap's state`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
};
