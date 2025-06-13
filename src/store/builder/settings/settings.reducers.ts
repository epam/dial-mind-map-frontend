import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { SettingsState } from './settings.types';

export const SettingsInitialState: SettingsState = {
  authProvider: '',
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
