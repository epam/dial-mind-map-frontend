import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { getHandler } from './getHandler';
import { postHandler } from './postHandler';

export const GET = withLogger(withAuth(getHandler));
export const POST = withLogger(withAuth(postHandler));
