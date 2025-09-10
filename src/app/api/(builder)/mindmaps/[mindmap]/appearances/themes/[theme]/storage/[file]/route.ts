import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { getFileHandler } from './getHandler';
import { uploadFileHandler } from './postHandler';

export const POST = withLogger(withAuth(uploadFileHandler));
export const GET = withLogger(withAuth(getFileHandler));
