import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { getIconHandler } from './getHandler';

export const GET = withLogger(withAuth(getIconHandler));
