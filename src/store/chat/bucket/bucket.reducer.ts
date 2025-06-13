import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as BucketSelectors from './bucket.selectors';
import { BucketState } from './bucket.types';

export { BucketSelectors };

export const BucketInitialState: BucketState = {
  bucketId: '',
  isLoading: false,
  error: null,
};

export const bucketSlice = createSlice({
  name: 'bucket',
  initialState: BucketInitialState,
  reducers: {
    fetchBucketStart: state => {
      state.isLoading = true;
      state.error = null;
    },
    fetchBucketSuccess: (state, { payload }: PayloadAction<string>) => {
      state.bucketId = payload;
      state.isLoading = false;
    },
    fetchBucketFailure: (state, { payload }: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = payload;
    },
  },
});

export const BucketActions = bucketSlice.actions;
