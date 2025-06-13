/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ToastType } from '@/types/toasts';

import { BuilderRootState } from '..';

export type View = 'graph' | 'table';

export interface UIState {
  theme: string;
  currentView: View;
  isNodeEditorOpen: boolean;
  nodeEditorWidth?: number;
  isGenEdgesConfirmModalOpen: boolean;
  isGenEdgesDelConfirmModalOpen: boolean;
  isGenEdgesLoaderModalOpen: boolean;
  isGenEdgesDelLoaderModalOpen: boolean;
  isRelayoutConfirmModalOpen: boolean;
  areGeneretedEdgesShowen: boolean;
  areInboundEdgesShowen: boolean;
  areOutboundEdgesShowen: boolean;
  isGenNodeInputOpen: boolean;
  sourceIdInVersionsModal?: string;
  sourceIdToAddVersion?: string;
  sourceIdToApplyToGraph?: string;
  dialChatHost: string;
  mindmapIframeTitle: string;
  isAllowApiKeyAuth: boolean;
  providers: string[];
  navigationTarget?: 'sources' | 'content';
}

export type UIStoredState = Pick<UIState, 'areGeneretedEdgesShowen' | 'currentView'>;

export const UIInitialState: UIState = {
  theme: '',
  currentView: 'graph',
  isNodeEditorOpen: false,
  isGenEdgesConfirmModalOpen: false,
  isGenEdgesDelConfirmModalOpen: false,
  isGenEdgesLoaderModalOpen: false,
  isGenEdgesDelLoaderModalOpen: false,
  isRelayoutConfirmModalOpen: false,
  areGeneretedEdgesShowen: true,
  areInboundEdgesShowen: true,
  areOutboundEdgesShowen: true,
  isGenNodeInputOpen: false,
  dialChatHost: '',
  mindmapIframeTitle: '',
  isAllowApiKeyAuth: false,
  providers: [],
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
    setIsNodeEditorOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isNodeEditorOpen = payload;
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
    softNavigateTo: (state, { payload }: PayloadAction<'sources' | 'content' | undefined>) => {
      state.navigationTarget = payload;
    },
  },
});

const rootSelector = (state: BuilderRootState): UIState => state.ui;

const selectTheme = createSelector([rootSelector], state => state.theme);

const selectCurrentView = createSelector([rootSelector], state => state.currentView);

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

export const UIActions = uiSlice.actions;

export const UISelectors = {
  selectTheme,
  selectDialChatHost,
  selectMindmapIframeTitle,
  selectCurrentView,
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
  selectIsAllowApiKey,
  selectProviders,
  selectNavigationTarget,
};
