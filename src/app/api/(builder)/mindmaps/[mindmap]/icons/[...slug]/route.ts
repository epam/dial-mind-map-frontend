import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { getIconHandler } from './getHandler';
import { uploadIconHandler } from './putHandler';

export const GET = withLogger(withAuth(getIconHandler));
export const PUT = withLogger(withAuth(uploadIconHandler));
