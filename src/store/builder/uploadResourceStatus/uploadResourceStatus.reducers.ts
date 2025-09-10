import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { BuilderRootState } from '..';

export interface UploadResourceStatus {
  inProgress: boolean;
  success: boolean;
  error: string | null;
  response?: string;
}

export type UploadKey = string;

interface UploadResourceStatusState {
  [key: UploadKey]: UploadResourceStatus;
}

const initialState: UploadResourceStatusState = {};

export const uploadResourceStatusSlice = createSlice({
  name: 'uploadResourceStatus',
  initialState,
  reducers: {
    startUpload: (state, { payload }: PayloadAction<{ key: UploadKey }>) => {
      state[payload.key] = {
        inProgress: true,
        success: false,
        error: null,
      };
    },
    uploadSuccess: (state, { payload }: PayloadAction<{ key: UploadKey; response?: string }>) => {
      state[payload.key] = {
        inProgress: false,
        success: true,
        error: null,
        response: payload.response,
      };
    },
    uploadFailure: (state, { payload }: PayloadAction<{ key: UploadKey; error: string }>) => {
      state[payload.key] = {
        inProgress: false,
        success: false,
        error: payload.error,
      };
    },
    clearUploadStatus: (state, { payload }: PayloadAction<{ key: UploadKey }>) => {
      delete state[payload.key];
    },
  },
});

const rootSelector = (state: BuilderRootState): UploadResourceStatusState => state.uploadResourceStatus;

const selectUploadStatus = (key: UploadKey) =>
  createSelector(
    [rootSelector],
    state =>
      state[key] ?? {
        inProgress: false,
        success: false,
        error: null,
      },
  );

export const UploadResourceStatusActions = uploadResourceStatusSlice.actions;

export const UploadResourceStatusSelectors = {
  selectUploadStatus,
};
