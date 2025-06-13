import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { getHistoryHandler } from './getHandler';
import { changeHistoryHandler } from './postHandler';

export const GET = withLogger(withAuth(getHistoryHandler));
export const POST = withLogger(withAuth(changeHistoryHandler));
