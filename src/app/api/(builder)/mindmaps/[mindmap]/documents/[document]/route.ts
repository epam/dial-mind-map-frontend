import { withAuth } from '@/utils/auth/withAuth';
import { withLogger } from '@/utils/server/withLogger';

import { deleteDocumentHandler } from './deleteHandler';
import { updateDocumentHandler } from './updateHandler';
import { updateNameHandler } from './updateNameHandler';

export const PUT = withLogger(withAuth(updateDocumentHandler));
export const DELETE = withLogger(withAuth(deleteDocumentHandler));
export const POST = withLogger(withAuth(updateNameHandler));
