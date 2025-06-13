import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { BuilderRootState } from '..';

export interface PreferencesState {
  isGenEdgesConfirmModalSkipped: boolean;
}

const initialState: PreferencesState = {
  isGenEdgesConfirmModalSkipped: false,
};

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    init: (state, { payload }: PayloadAction<PreferencesState>) => {
      state.isGenEdgesConfirmModalSkipped = payload.isGenEdgesConfirmModalSkipped;
    },
    setIsGenEdgesConfirmModalSkipped: (state, { payload }: PayloadAction<boolean>) => {
      state.isGenEdgesConfirmModalSkipped = payload;
    },
  },
});

const rootSelector = (state: BuilderRootState): PreferencesState => state.preferences;

const selectIsGenEdgesConfirmModalSkipped = createSelector(
  [rootSelector],
  state => state.isGenEdgesConfirmModalSkipped,
);

export const PreferencesActions = preferencesSlice.actions;

export const PreferencesSelectors = {
  selectIsGenEdgesConfirmModalSkipped,
};
