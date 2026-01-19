/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { JSX } from 'react';

import { AuthUiMode } from '@/types/auth';
import { Pages } from '@/types/common';
import { ThemesConfigs } from '@/types/themes';
import { ToastType } from '@/types/toasts';

import { BuilderRootState } from '..';

export type View = 'graph' | 'table';
export type CustomizeView = 'form' | 'json';

export interface UIState {
  theme: string;
  themesConfig: ThemesConfigs | null;
  currentView: View;
  currentCustomizeView: CustomizeView;
  isNodeEditorOpen: boolean;
  nodeEditorWidth?: number;
  isGenEdgesConfirmModalOpen: boolean;
  isGenEdgesDelConfirmModalOpen: boolean;
  isGenEdgesLoaderModalOpen: boolean;
  isGenEdgesDelLoaderModalOpen: boolean;
  isRelayoutConfirmModalOpen: boolean;
  isResetThemeConfirmModalOpen: boolean;
  areGeneretedEdgesShowen: boolean;
  areInboundEdgesShowen: boolean;
  areOutboundEdgesShowen: boolean;
  isGenNodeInputOpen: boolean;
  sourceIdInVersionsModal?: string;
  sourceIdToAddVersion?: string;
  sourceIdToApplyToGraph?: string;
  dialChatHost: string;
  dialIframeAllowedHosts?: string[];
  mindmapIframeTitle: string;
  isAllowApiKeyAuth: boolean;
  providers: string[];
  navigationTarget?: Pages;
  authUiMode: AuthUiMode;
  isSimpleGenerationModeAvailable: boolean;
  isOffline?: boolean;
  isServerUnavailable: boolean;
}

export type UIStoredState = Pick<UIState, 'areGeneretedEdgesShowen' | 'currentView'>;

export const UIInitialState: UIState = {
  theme: 'dark',
  themesConfig: null,
  currentView: 'graph',
  currentCustomizeView: 'form',
  isNodeEditorOpen: false,
  isGenEdgesConfirmModalOpen: false,
  isGenEdgesDelConfirmModalOpen: false,
  isGenEdgesLoaderModalOpen: false,
  isGenEdgesDelLoaderModalOpen: false,
  isRelayoutConfirmModalOpen: false,
  isResetThemeConfirmModalOpen: false,
  areGeneretedEdgesShowen: true,
  areInboundEdgesShowen: true,
  areOutboundEdgesShowen: true,
  isGenNodeInputOpen: false,
  dialChatHost: '',
  mindmapIframeTitle: '',
  isAllowApiKeyAuth: false,
  providers: [],
  authUiMode: AuthUiMode.Popup,
  isSimpleGenerationModeAvailable: false,
  isOffline: false,
  isServerUnavailable: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState: UIInitialState,
  reducers: {
    init: (state, { payload }: PayloadAction<UIState>) => {
      state.areGeneretedEdgesShowen = payload.areGeneretedEdgesShowen;
      state.currentView = payload.currentView;
    },
    setTheme: (state, { payload }: PayloadAction<string>) => {
      state.theme = payload;
    },
    setCurrentView: (state, { payload }: PayloadAction<View>) => {
      state.currentView = payload;
    },
    setCurrentCustomizeView: (state, { payload }: PayloadAction<CustomizeView>) => {
      state.currentCustomizeView = payload;
    },
    setIsNodeEditorOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isNodeEditorOpen = payload;
    },
    setIsResetThemeConfirmModalOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isResetThemeConfirmModalOpen = payload;
    },
    setNodeEditorWidth: (state, { payload }: PayloadAction<number>) => {
      state.nodeEditorWidth = payload;
    },
    setIsGenEdgesConfirmModalOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isGenEdgesConfirmModalOpen = payload;
    },
    setIsGenEdgesDelConfirmModalOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isGenEdgesDelConfirmModalOpen = payload;
    },
    setIsGenEdgesLoaderModalOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isGenEdgesLoaderModalOpen = payload;
    },
    setIsGenEdgesDelLoaderModalOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isGenEdgesDelLoaderModalOpen = payload;
    },
    setIsRelayoutConfirmModalOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isRelayoutConfirmModalOpen = payload;
    },
    setAreGeneretedEdgesShowen: (state, { payload }: PayloadAction<{ value: boolean; skipRefresh?: boolean }>) => {
      state.areGeneretedEdgesShowen = payload.value;
    },
    setAreInboundEdgesShowen: (state, { payload }: PayloadAction<boolean>) => {
      state.areInboundEdgesShowen = payload;
    },
    setAreOutboundEdgesShowen: (state, { payload }: PayloadAction<boolean>) => {
      state.areOutboundEdgesShowen = payload;
    },
    setIsGenNodeInputOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isGenNodeInputOpen = payload;
    },
    setDialChatHost: (state, { payload }: PayloadAction<string>) => {
      state.dialChatHost = payload;
    },
    setMindmapIframeTitle: (state, { payload }: PayloadAction<string>) => {
      state.mindmapIframeTitle = payload;
    },
    setSourceIdInVersionsModal: (state, { payload }: PayloadAction<string | undefined>) => {
      state.sourceIdInVersionsModal = payload;
    },
    setSourceIdToAddVersion: (state, { payload }: PayloadAction<string | undefined>) => {
      state.sourceIdToAddVersion = payload;
    },
    setSourceIdToApplyToGraph: (state, { payload }: PayloadAction<string | undefined>) => {
      state.sourceIdToApplyToGraph = payload;
    },
    showErrorToast: (state, action: PayloadAction<string>) => state,
    showToast: (
      state,
      action: PayloadAction<{
        message?: string | null;
        type?: ToastType;
        response?: Response;
        icon?: JSX.Element;
        duration?: number;
      }>,
    ) => state,
    softNavigateTo: (state, { payload }: PayloadAction<Pages | undefined>) => {
      state.navigationTarget = payload;
    },
    setIsOffline: (state, { payload }: PayloadAction<boolean>) => {
      state.isOffline = payload;
    },
    setIsServerUnavailable: (state, { payload }: PayloadAction<boolean>) => {
      state.isServerUnavailable = payload;
    },
  },
});

const rootSelector = (state: BuilderRootState): UIState => state.ui;

const selectTheme = createSelector([rootSelector], state => state.theme);

const selectThemesConfig = createSelector([rootSelector], state => state.themesConfig);

const selectCodeEditorTheme = createSelector([selectTheme, selectThemesConfig], (theme, themesConfig) => {
  const selectedTheme = theme && themesConfig ? themesConfig.themes.find(({ id }) => id === theme) : undefined;
  return selectedTheme?.['code-editor-theme'] ?? (theme === 'dark' ? 'vs-dark' : 'vs');
});

const selectCurrentView = createSelector([rootSelector], state => state.currentView);

const selectDialIframeAllowedHosts = createSelector([rootSelector], state => state.dialIframeAllowedHosts);

const selectCurrentCustomizeView = createSelector([rootSelector], state => state.currentCustomizeView);

const selectIsNodeEditorOpen = createSelector([rootSelector], state => state.isNodeEditorOpen);

const selectNodeEditorWidth = createSelector([rootSelector], state => state.nodeEditorWidth);

const selectIsGenEdgesConfirmModalOpen = createSelector([rootSelector], state => state.isGenEdgesConfirmModalOpen);

const selectIsGenEdgesDelConfirmModalOpen = createSelector(
  [rootSelector],
  state => state.isGenEdgesDelConfirmModalOpen,
);

const selectIsGenEdgesLoaderModalOpen = createSelector([rootSelector], state => state.isGenEdgesLoaderModalOpen);

const selectIsGenEdgesDelLoaderModalOpen = createSelector([rootSelector], state => state.isGenEdgesDelLoaderModalOpen);

const selectIsRelayoutConfirmModalOpen = createSelector([rootSelector], state => state.isRelayoutConfirmModalOpen);

const selectAreGeneretedEdgesShowen = createSelector([rootSelector], state => state.areGeneretedEdgesShowen);

const selectAreInboundEdgesShowen = createSelector([rootSelector], state => state.areInboundEdgesShowen);

const selectAreOutboundEdgesShowen = createSelector([rootSelector], state => state.areOutboundEdgesShowen);

const selectIsGenNodeInputOpen = createSelector([rootSelector], state => state.isGenNodeInputOpen);

const selectDialChatHost = createSelector([rootSelector], state => state.dialChatHost);

const selectMindmapIframeTitle = createSelector([rootSelector], state => state.mindmapIframeTitle);

const selectIsAllowApiKey = createSelector([rootSelector], state => state.isAllowApiKeyAuth);

const selectProviders = createSelector([rootSelector], state => state.providers);

const selectSourceIdInVersionsModal = createSelector([rootSelector], state => state.sourceIdInVersionsModal);

const selectSourceIdToAddVersion = createSelector([rootSelector], state => state.sourceIdToAddVersion);

const selectSourceIdToApplyToGraph = createSelector([rootSelector], state => state.sourceIdToApplyToGraph);

const selectNavigationTarget = createSelector([rootSelector], state => state.navigationTarget);

const selectIsResetThemeConfirmModalOpen = createSelector([rootSelector], state => state.isResetThemeConfirmModalOpen);

const selectAuthUiMode = createSelector([rootSelector], state => state.authUiMode);

const selectIsOffline = createSelector([rootSelector], state => state.isOffline);

const selectIsServerUnavailable = createSelector([rootSelector], state => state.isServerUnavailable);

const selectIsSimpleGenerationModeAvailable = createSelector(
  [rootSelector],
  state => state.isSimpleGenerationModeAvailable,
);

export const UIActions = uiSlice.actions;

export const UISelectors = {
  selectTheme,
  selectDialChatHost,
  selectMindmapIframeTitle,
  selectCurrentView,
  selectCurrentCustomizeView,
  selectIsNodeEditorOpen,
  selectNodeEditorWidth,
  selectIsGenEdgesConfirmModalOpen,
  selectIsGenEdgesDelConfirmModalOpen,
  selectIsGenEdgesLoaderModalOpen,
  selectIsGenEdgesDelLoaderModalOpen,
  selectSourceIdInVersionsModal,
  selectSourceIdToAddVersion,
  selectSourceIdToApplyToGraph,
  selectIsRelayoutConfirmModalOpen,
  selectAreGeneretedEdgesShowen,
  selectAreInboundEdgesShowen,
  selectAreOutboundEdgesShowen,
  selectIsGenNodeInputOpen,
  selectDialIframeAllowedHosts,
  selectIsAllowApiKey,
  selectProviders,
  selectNavigationTarget,
  selectIsResetThemeConfirmModalOpen,
  selectAuthUiMode,
  selectIsSimpleGenerationModeAvailable,
  selectIsOffline,
  selectThemesConfig,
  selectCodeEditorTheme,
  selectIsServerUnavailable,
};
