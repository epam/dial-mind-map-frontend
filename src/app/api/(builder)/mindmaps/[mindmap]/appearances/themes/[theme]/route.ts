import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { getThemeHandler } from './getHandler';
import { updateThemeHandler } from './postHandler';

export const GET = withLogger(withAuth(getThemeHandler));
export const POST = withLogger(withAuth(updateThemeHandler));
