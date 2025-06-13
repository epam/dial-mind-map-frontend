import { NextRequest } from 'next/server';

import { AuthParams } from '@/types/api';
import { HistoryActionTypes } from '@/types/common';
import { handleUndoRedo } from '@/utils/server/handleUndoRedo';

export const changeHistoryHandler = async (
  req: NextRequest,
  authParams: AuthParams,
  { params }: { params: { mindmap: string } },
) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') as HistoryActionTypes;

  return await handleUndoRedo(req, params.mindmap, action, authParams);
};
