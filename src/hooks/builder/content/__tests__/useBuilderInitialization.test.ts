import { ChatVisualizerConnector } from '@epam/ai-dial-chat-visualizer-connector';
import { renderHook } from '@testing-library/react';

import { useBuilderDispatch } from '@/store/builder/hooks';
import { PreferencesActions, PreferencesState } from '@/store/builder/preferences/preferences.reducers';
import { UIActions, UIInitialState } from '@/store/builder/ui/ui.reducers';
import { StorageKeys } from '@/types/storage';
import { BrowserStorage } from '@/utils/app/browser-storage';

import { useBuilderInitialization } from '../useBuilderInitialization';

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
}));

jest.mock('@/utils/app/browser-storage', () => ({
  BrowserStorage: {
    getData: jest.fn(),
  },
}));

const mockSendReady = jest.fn();
const mockSendReadyToInteract = jest.fn();

jest.mock('@epam/ai-dial-chat-visualizer-connector', () => {
  return {
    ChatVisualizerConnector: jest.fn().mockImplementation(() => ({
      sendReady: mockSendReady,
      sendReadyToInteract: mockSendReadyToInteract,
    })),
  };
});

describe('useBuilderInitialization', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useBuilderDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize preferences state if stored data exists', () => {
    const mockPreferences: PreferencesState = { isGenEdgesConfirmModalSkipped: true };
    (BrowserStorage.getData as jest.Mock).mockImplementation(key => {
      return key === StorageKeys.Preferences ? mockPreferences : null;
    });

    renderHook(() => useBuilderInitialization(null, null));

    expect(mockDispatch).toHaveBeenCalledWith(PreferencesActions.init(mockPreferences));
  });

  it('should initialize UI state if stored data exists', () => {
    const mockUIState = { sidebarOpen: true };
    (BrowserStorage.getData as jest.Mock).mockImplementation(key => {
      return key === StorageKeys.UI ? mockUIState : null;
    });

    renderHook(() => useBuilderInitialization(null, null));

    expect(mockDispatch).toHaveBeenCalledWith(UIActions.init({ ...UIInitialState, ...mockUIState }));
  });

  it('should initialize ChatVisualizerConnector when dialHost and mindmapIframeTitle are provided', () => {
    const mockDialHost = 'https://example.com';
    const mockIframeTitle = 'Mindmap';

    renderHook(() => useBuilderInitialization(mockDialHost, mockIframeTitle));

    expect(ChatVisualizerConnector).toHaveBeenCalledWith(mockDialHost, mockIframeTitle, expect.any(Function));
    expect(mockSendReady).toHaveBeenCalled();
    expect(mockSendReadyToInteract).toHaveBeenCalled();
  });
});
