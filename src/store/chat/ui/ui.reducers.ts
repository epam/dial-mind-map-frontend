/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  mindmapIframeTitle: string;
  theme: string;
  isPreview?: boolean;
  isAllowApiKeyAuth: boolean;
  chatDisclaimer?: string;
  providers: string[];
}

const initialState: UIState = {
  isMapHidden: false,
  isChatHidden: false,
  deviceType: DeviceType.Unknown,
  dialChatHost: '',
  mindmapIframeTitle: '',
  theme: '',
  isAllowApiKeyAuth: false,
  chatDisclaimer: undefined,
  providers: [],
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
    setTheme: (state, { payload }: PayloadAction<string>) => {
      state.theme = payload;
    },
    setIsPreview: (state, { payload }: PayloadAction<boolean>) => {
      state.isPreview = payload;
    },
  },
});

const rootSelector = (state: ChatRootState): UIState => state.chatUI;

const selectIsPreview = createSelector([rootSelector], state => state.isPreview);

export const selectIsMapHidden = createSelector([rootSelector], state => state.isMapHidden);

export const selectIsChatHidden = createSelector([rootSelector], state => state.isChatHidden);

export const selectDeviceType = createSelector([rootSelector], state => state.deviceType);

export const selectDialChatHost = createSelector([rootSelector], state => state.dialChatHost);

export const selectMindmapIframeTitle = createSelector([rootSelector], state => state.mindmapIframeTitle);

export const selectIsAllowApiKey = createSelector([rootSelector], state => state.isAllowApiKeyAuth);

export const selectChatDisclaimer = createSelector([rootSelector], state => state.chatDisclaimer);

export const selectProviders = createSelector([rootSelector], state => state.providers);

export const selectTheme = createSelector([rootSelector], state => state.theme);

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
  selectTheme,
};
