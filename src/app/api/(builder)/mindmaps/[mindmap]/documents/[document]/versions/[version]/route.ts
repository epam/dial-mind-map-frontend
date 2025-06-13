import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { createDocumentHandler } from '../../../createHandler';

export const POST = withLogger(withAuth(createDocumentHandler));
