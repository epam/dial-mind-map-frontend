/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const referenceSlice = createSlice({
  name: 'reference',
  initialState: {},
  reducers: {
    downloadSource: (state, { payload }: PayloadAction<{ sourceId: string; versionId: number; name?: string }>) =>
      state,
  },
});

export const ReferenceActions = referenceSlice.actions;
