import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { BuilderRootState } from '..';
import { SettingsState } from './settings.types';

export const SettingsInitialState: SettingsState = {
  authProvider: '',
  googleFontsApiKey: '',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: SettingsInitialState,
  reducers: {
    setAuthProvider: (state, { payload }: PayloadAction<string>) => {
      state.authProvider = payload;
    },
  },
});

export const BuilderActions = settingsSlice.actions;

const rootSelector = (state: BuilderRootState): SettingsState => state.settings;

const selectGoogleFontsApiKey = createSelector([rootSelector], state => state.googleFontsApiKey);

export const SettingsSelectors = {
  selectGoogleFontsApiKey,
};
