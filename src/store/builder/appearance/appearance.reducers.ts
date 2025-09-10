/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ChatNodeResourceKey, GraphImgResourceKey, IconResourceKey, ThemeConfig } from '@/types/customization';

import { BuilderRootState } from '..';

export interface AppearanceState {
  themeConfig?: ThemeConfig;
  isResetThemeInProgress: boolean;

  isExportInProgress: boolean;
  exportError: string | null;

  isImportInProgress: boolean;
  importError: string | null;
}

export const AppearanceInitialState: AppearanceState = {
  themeConfig: undefined,
  isResetThemeInProgress: false,

  isExportInProgress: false,
  exportError: null,

  isImportInProgress: false,
  importError: null,
};

export const appearanceSlice = createSlice({
  name: 'appearance',
  initialState: AppearanceInitialState,
  reducers: {
    setThemeConfig: (state, { payload }: PayloadAction<ThemeConfig>) => {
      state.themeConfig = payload;
    },
    updateThemeConfig: (state, { payload }: PayloadAction<{ config: ThemeConfig; theme: string }>) => state,
    fetchThemeConfig: (state, { payload }: PayloadAction<{ theme: string }>) => state,
    resetThemeConfig: (state, { payload }: PayloadAction<{ theme: string }>) => {
      state.isResetThemeInProgress = true;
    },
    addBranchGroup: (state, { payload }: PayloadAction<{ theme: string }>) => {
      if (!state.themeConfig) return;
      state.themeConfig.graph.paletteSettings.branchesColors.push({ bgColor: '' });
    },
    setIsResetThemeInProgress: (state, { payload }: PayloadAction<boolean>) => {
      state.isResetThemeInProgress = payload;
    },
    fetchThemeConfigFinished: (state, { payload }: PayloadAction<ThemeConfig | undefined>) => state,
    subscribeOnTheme: (state, { payload }: PayloadAction<{ theme: string }>) => state,
    initTheme: (state, { payload }: PayloadAction<{ theme: string }>) => state,

    exportAppearances: state => {
      state.isExportInProgress = true;
      state.exportError = null;
    },
    exportAppearancesSuccess: state => {
      state.isExportInProgress = false;
    },
    exportAppearancesFailure: (state, { payload }: PayloadAction<string>) => {
      state.isExportInProgress = false;
      state.exportError = payload;
    },

    importAppearances: (state, { payload }: PayloadAction<{ file: File }>) => {
      state.isImportInProgress = true;
      state.importError = null;
    },
    importAppearancesSuccess: state => {
      state.isImportInProgress = false;
    },
    importAppearancesFailure: (state, { payload }: PayloadAction<string>) => {
      state.isImportInProgress = false;
      state.importError = payload;
    },
    uploadResource: (
      state,
      {
        payload,
      }: PayloadAction<{
        type: IconResourceKey | GraphImgResourceKey | ChatNodeResourceKey;
        fileName: string;
        file: File;
      }>,
    ) => state,
    uploadFont: (
      state,
      {
        payload,
      }: PayloadAction<{
        fileName: string;
        file: File;
        type: string;
      }>,
    ) => state,
  },
});

const rootSelector = (state: BuilderRootState): AppearanceState => state.appearance;

const selectThemeConfig = createSelector([rootSelector], state => state.themeConfig);

const selectIsResetThemeInProgress = createSelector([rootSelector], state => state.isResetThemeInProgress);

const selectIsExportInProgress = createSelector([rootSelector], state => state.isExportInProgress);
const selectExportError = createSelector([rootSelector], state => state.exportError);

const selectIsImportInProgress = createSelector([rootSelector], state => state.isImportInProgress);
const selectImportError = createSelector([rootSelector], state => state.importError);

export const AppearanceActions = appearanceSlice.actions;

export const AppearanceSelectors = {
  selectThemeConfig,
  selectIsResetThemeInProgress,
  selectIsExportInProgress,
  selectExportError,
  selectIsImportInProgress,
  selectImportError,
};
