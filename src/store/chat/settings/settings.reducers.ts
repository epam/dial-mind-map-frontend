import { createSelector, createSlice } from '@reduxjs/toolkit';

import { ChatRootState } from '..';

export interface SettingsState {
  isProdEnv: boolean;
}

export const SettingsInitialState: SettingsState = {
  isProdEnv: false,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: SettingsInitialState,
  reducers: {},
});

export const SettingsActions = settingsSlice.actions;

const rootSelector = (state: ChatRootState): SettingsState => state.settings;

const selectIsProdEnv = createSelector([rootSelector], state => state.isProdEnv);

export const SettingsSelectors = {
  selectIsProdEnv,
};
