import { createSelector } from '@reduxjs/toolkit';

import { ChatRootState } from '../index';
import { BucketState } from './bucket.types';

const rootSelector = (state: ChatRootState): BucketState => state.bucket;

export const selectBucketId = createSelector([rootSelector], state => state.bucketId);

export const selectBucket = createSelector([rootSelector], state => state);
