import { DialAIError } from '@/types/error';

import { constructPath } from '../app/file';
import { ServerUtils } from './api';

export const getEntityUrlFromSlugs = (dialApiHost: string, slugs: string[]): string => {
  if (!slugs || slugs.length === 0) {
    throw new DialAIError(`No applications path provided`, '', '', '400');
  }

  return constructPath(dialApiHost, 'v1', 'applications', ServerUtils.encodeSlugs(slugs));
};
