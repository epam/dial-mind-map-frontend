import { AuthUiMode } from '@/types/auth';
import { ToastType } from '@/types/toasts';

import { ChatUIActions, ChatUISelectors, chatUISlice, DeviceType } from '../ui.reducers';

describe('chatUISlice reducer and selectors', () => {
  const reducer = chatUISlice.reducer;
  const initialState = reducer(undefined, { type: '@@INIT' } as any);

  it('should return the initial state', () => {
    expect(initialState).toEqual({
      isMapHidden: false,
      isOffline: false,
      isServerUnavailable: false,
      isChatHidden: false,
      deviceType: DeviceType.Unknown,
      dialChatHost: '',
      mindmapIframeTitle: '',
      themeName: 'dark',
      isAllowApiKeyAuth: false,
      chatDisclaimer: undefined,
      providers: [],
      authUiMode: AuthUiMode.Popup,
      isFitGraphAvailable: false,
    });
  });

  describe('reducers', () => {
    it('setIsMapHidden toggles map visibility', () => {
      const s1 = reducer(initialState, ChatUIActions.setIsMapHidden(true));
      expect(s1.isMapHidden).toBe(true);
      const s2 = reducer(s1, ChatUIActions.setIsMapHidden(false));
      expect(s2.isMapHidden).toBe(false);
    });

    it('setIsChatHidden toggles chat visibility', () => {
      const s1 = reducer(initialState, ChatUIActions.setIsChatHidden(true));
      expect(s1.isChatHidden).toBe(true);
    });

    it('setDeviceType sets deviceType', () => {
      const s = reducer(initialState, ChatUIActions.setDeviceType(DeviceType.Desktop));
      expect(s.deviceType).toBe(DeviceType.Desktop);
    });

    it('setDialChatHost updates host', () => {
      const host = 'https://chat.example.com';
      const s = reducer(initialState, ChatUIActions.setDialChatHost(host));
      expect(s.dialChatHost).toBe(host);
    });

    it('setMindmapIframeTitle updates title', () => {
      const title = 'My Mindmap';
      const s = reducer(initialState, ChatUIActions.setMindmapIframeTitle(title));
      expect(s.mindmapIframeTitle).toBe(title);
    });

    it('setThemeName updates themeName', () => {
      const s = reducer(initialState, ChatUIActions.setThemeName('light-mode'));
      expect(s.themeName).toBe('light-mode');
    });

    it('setIsPreview sets preview flag', () => {
      const s = reducer(initialState, ChatUIActions.setIsPreview(true));
      expect(s.isPreview).toBe(true);
    });

    it('showErrorToast and showToast are no-ops on state', () => {
      const s1 = reducer(initialState, ChatUIActions.showErrorToast('error'));
      const s2 = reducer(initialState, ChatUIActions.showToast({ message: 'hi', type: ToastType.Info }));
      expect(s1).toEqual(initialState);
      expect(s2).toEqual(initialState);
    });

    it('reset returns the same state', () => {
      const modified = {
        ...initialState,
        isMapHidden: true,
        isChatHidden: true,
        deviceType: DeviceType.Mobile,
        dialChatHost: 'host',
        mindmapIframeTitle: 'title',
        themeName: 'light',
        isPreview: true,
      };
      expect(reducer(modified, ChatUIActions.reset())).toEqual(modified);
    });
  });

  describe('selectors', () => {
    const rootState = { chatUI: initialState } as any;

    it('selectIsMapHidden', () => {
      expect(ChatUISelectors.selectIsMapHidden(rootState)).toBe(false);
    });

    it('selectIsChatHidden', () => {
      expect(ChatUISelectors.selectIsChatHidden(rootState)).toBe(false);
    });

    it('selectDeviceType', () => {
      expect(ChatUISelectors.selectDeviceType(rootState)).toBe(DeviceType.Unknown);
    });

    it('selectDialChatHost', () => {
      expect(ChatUISelectors.selectDialChatHost(rootState)).toBe('');
    });

    it('selectMindmapIframeTitle', () => {
      expect(ChatUISelectors.selectMindmapIframeTitle(rootState)).toBe('');
    });

    it('selectIsAllowApiKey', () => {
      expect(ChatUISelectors.selectIsAllowApiKey(rootState)).toBe(false);
    });

    it('selectChatDisclaimer', () => {
      expect(ChatUISelectors.selectChatDisclaimer(rootState)).toBeUndefined();
    });

    it('selectProviders', () => {
      expect(ChatUISelectors.selectProviders(rootState)).toEqual([]);
    });

    it('selectThemeName', () => {
      expect(ChatUISelectors.selectThemeName(rootState)).toBe('dark');
    });

    it('selectAuthUiMode', () => {
      expect(ChatUISelectors.selectAuthUiMode(rootState)).toBe(AuthUiMode.Popup);
    });

    it('selectIsPreview returns undefined when not set', () => {
      expect(ChatUISelectors.selectIsPreview(rootState)).toBeUndefined();
    });

    it('selectIsPreview returns correct boolean when set', () => {
      const stateFalse = { chatUI: { ...initialState, isPreview: false } } as any;
      expect(ChatUISelectors.selectIsPreview(stateFalse)).toBe(false);
      const stateTrue = { chatUI: { ...initialState, isPreview: true } } as any;
      expect(ChatUISelectors.selectIsPreview(stateTrue)).toBe(true);
    });
  });
});
