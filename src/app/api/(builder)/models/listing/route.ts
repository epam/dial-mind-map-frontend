import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { getModelsHandler } from './getHandler';

export const GET = withLogger(withAuth(getModelsHandler));
