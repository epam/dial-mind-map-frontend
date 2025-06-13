import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { createDocumentHandler } from './createHandler';
import { getDocumentsHandler } from './getHandler';

export const GET = withLogger(withAuth(getDocumentsHandler));
export const POST = withLogger(withAuth(createDocumentHandler));
