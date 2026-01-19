/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { JSX } from 'react';

import { AuthUiMode } from '@/types/auth';
import { ToastType } from '@/types/toasts';

import { ChatRootState } from '..';

export enum DeviceType {
  Unknown = 'unknown',
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop',
}

export interface UIState {
  isMapHidden: boolean;
  isChatHidden: boolean;
  deviceType: DeviceType;
  dialChatHost: string;
  dialIframeAllowedHosts?: string[];
  mindmapIframeTitle: string;
  isPreview?: boolean;
  isAllowApiKeyAuth: boolean;
  chatDisclaimer?: string;
  providers: string[];
  themeName: string;
  authUiMode: AuthUiMode;
  isOffline?: boolean;
  isFitGraphAvailable: boolean;
  isServerUnavailable: boolean;
}

const initialState: UIState = {
  isMapHidden: false,
  isChatHidden: false,
  deviceType: DeviceType.Unknown,
  dialChatHost: '',
  mindmapIframeTitle: '',
  themeName: 'dark',
  isAllowApiKeyAuth: false,
  chatDisclaimer: undefined,
  providers: [],
  authUiMode: AuthUiMode.Popup,
  isOffline: false,
  isFitGraphAvailable: false,
  isServerUnavailable: false,
};

export const chatUISlice = createSlice({
  name: 'chatUI',
  initialState,
  reducers: {
    setIsMapHidden: (state, { payload }: PayloadAction<boolean>) => {
      state.isMapHidden = payload;
    },
    setIsChatHidden: (state, { payload }: PayloadAction<boolean>) => {
      state.isChatHidden = payload;
    },
    setDeviceType: (state, { payload }: PayloadAction<DeviceType>) => {
      state.deviceType = payload;
    },
    setDialChatHost: (state, { payload }: PayloadAction<string>) => {
      state.dialChatHost = payload;
    },
    reset: state => state,
    setMindmapIframeTitle: (state, { payload }: PayloadAction<string>) => {
      state.mindmapIframeTitle = payload;
    },
    showErrorToast: (state, action: PayloadAction<string>) => state,
    showToast: (
      state,
      action: PayloadAction<{
        message?: string | null;
        type?: ToastType;
        response?: Response;
        icon?: JSX.Element;
      }>,
    ) => state,
    setThemeName: (state, { payload }: PayloadAction<string>) => {
      state.themeName = payload;
    },
    setIsPreview: (state, { payload }: PayloadAction<boolean>) => {
      state.isPreview = payload;
    },
    setIsOffline: (state, { payload }: PayloadAction<boolean>) => {
      state.isOffline = payload;
    },
    setIsServerUnavailable: (state, { payload }: PayloadAction<boolean>) => {
      state.isServerUnavailable = payload;
    },
    setIsFitGraphAvailable: (state, { payload }: PayloadAction<boolean>) => {
      state.isFitGraphAvailable = payload;
    },
  },
});

const rootSelector = (state: ChatRootState): UIState => state.chatUI;

const selectIsPreview = createSelector([rootSelector], state => state.isPreview);

const selectIsMapHidden = createSelector([rootSelector], state => state.isMapHidden);

const selectIsChatHidden = createSelector([rootSelector], state => state.isChatHidden);

const selectDeviceType = createSelector([rootSelector], state => state.deviceType);

const selectDialChatHost = createSelector([rootSelector], state => state.dialChatHost);

const selectMindmapIframeTitle = createSelector([rootSelector], state => state.mindmapIframeTitle);

const selectIsAllowApiKey = createSelector([rootSelector], state => state.isAllowApiKeyAuth);

const selectChatDisclaimer = createSelector([rootSelector], state => state.chatDisclaimer);

const selectProviders = createSelector([rootSelector], state => state.providers);

const selectThemeName = createSelector([rootSelector], state => state.themeName);

const selectAuthUiMode = createSelector([rootSelector], state => state.authUiMode);

const selectIsOffline = createSelector([rootSelector], state => state.isOffline);

const selectIsFitGraphAvailable = createSelector([rootSelector], state => state.isFitGraphAvailable);

const selectDialIframeAllowedHosts = createSelector([rootSelector], state => state.dialIframeAllowedHosts);

const selectIsServerUnavailable = createSelector([rootSelector], state => state.isServerUnavailable);

export const ChatUIActions = chatUISlice.actions;

export const ChatUISelectors = {
  selectIsChatHidden,
  selectIsMapHidden,
  selectDeviceType,
  selectDialChatHost,
  selectMindmapIframeTitle,
  selectIsPreview,
  selectIsAllowApiKey,
  selectChatDisclaimer,
  selectProviders,
  selectThemeName,
  selectAuthUiMode,
  selectIsOffline,
  selectIsFitGraphAvailable,
  selectDialIframeAllowedHosts,
  selectIsServerUnavailable,
};
