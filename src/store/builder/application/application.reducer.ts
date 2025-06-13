import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Application } from '@/types/application';

import * as ApplicationSelectors from './application.selectors';
import { ApplicationState } from './application.types';

export { ApplicationSelectors };

export const ApplicationInitialState: ApplicationState = {
  application: undefined,
  isLoading: false,
  error: null,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateApplication: (state, { payload }: PayloadAction<{ name: string }>) => state,
    updateApplicationSuccess: (state, { payload }: PayloadAction<Application>) => {
      if (Object.keys(payload).length) {
        state.application = payload;
      }
    },
    updateApplicationFailure: (state, { payload }: PayloadAction<string>) => {
      state.error = payload;
    },
  },
});

export const ApplicationActions = applicationSlice.actions;
