import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { getGraphHandler } from './getHandler';
import { patchGraphHandler } from './patchHandler';

export const GET = withLogger(withAuth(getGraphHandler));
export const PATCH = withLogger(withAuth(patchGraphHandler));
