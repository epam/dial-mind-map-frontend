import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Application } from '@/types/application';

import * as ApplicationSelectors from './application.selectors';
import { ApplicationState } from './application.types';

export { ApplicationSelectors };

export const ApplicationInitialState: ApplicationState = {
  application: undefined,
  isLoading: false,
  error: null,
  etag: undefined,
};

export const applicationSlice = createSlice({
  name: 'application',
  initialState: ApplicationInitialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fetchApplicationStart: (state, { payload }: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchApplicationSuccess: (state, { payload }: PayloadAction<Application>) => {
      state.application = payload;
      state.isLoading = false;
    },
    fetchApplicationFailure: (state, { payload }: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = payload;
    },
    subscribe: state => state,
    fetchUpdatedApplication: state => state,
    fetchUpdatedApplicationSuccess: (state, { payload }: PayloadAction<Application>) => {
      state.application = payload;
    },
    compareUpdatedData: (
      state,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      { payload: { updateEvent } }: PayloadAction<{ updateEvent: { action: string; etag: string; timestamp: number } }>,
    ) => state,
    setEtag: (state, { payload }: PayloadAction<string>) => {
      state.etag = payload;
    },
  },
});

export const ApplicationActions = applicationSlice.actions;
