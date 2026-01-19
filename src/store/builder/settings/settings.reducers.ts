import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { BuilderRootState } from '..';

export interface SettingsState {
  authProvider: string;
  googleFontsApiKey: string;
  isProdEnv: boolean;
  generationSourcesTokensLimit?: number;
}

export const SettingsInitialState: SettingsState = {
  authProvider: '',
  googleFontsApiKey: '',
  isProdEnv: false,
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

export const SettingsActions = settingsSlice.actions;

const rootSelector = (state: BuilderRootState): SettingsState => state.settings;

const selectGoogleFontsApiKey = createSelector([rootSelector], state => state.googleFontsApiKey);

const selectGenerationSourcesTokensLimit = createSelector([rootSelector], state => state.generationSourcesTokensLimit);

const selectIsProdEnv = createSelector([rootSelector], state => state.isProdEnv);

export const SettingsSelectors = {
  selectGoogleFontsApiKey,
  selectIsProdEnv,
  selectGenerationSourcesTokensLimit,
};
