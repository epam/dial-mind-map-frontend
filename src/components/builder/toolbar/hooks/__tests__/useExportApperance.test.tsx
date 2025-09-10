import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useDispatch } from 'react-redux';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';

import { useExportAppearance } from '../useExportApperance';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('@/store/builder/hooks', () => ({
  useBuilderSelector: jest.fn(),
}));

jest.mock('@/store/builder/appearance/appearance.reducers', () => ({
  AppearanceActions: {
    exportAppearances: jest.fn(),
  },
  AppearanceSelectors: {
    selectIsExportInProgress: jest.fn(),
  },
}));

describe('useExportAppearance', () => {
  let dispatchMock: jest.Mock;

  beforeEach(() => {
    dispatchMock = jest.fn();
    (useDispatch as unknown as jest.Mock).mockReturnValue(dispatchMock);
    (AppearanceActions.exportAppearances as unknown as jest.Mock).mockReturnValue({ type: 'EXPORT_APPEARANCES' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return isExportInProgress as true when selector returns true', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === AppearanceSelectors.selectIsExportInProgress) return true;
      return undefined;
    });

    const { result } = renderHook(() => useExportAppearance());

    expect(result.current.isExportInProgress).toBe(true);
  });

  test('should return isExportInProgress as false when selector returns false', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === AppearanceSelectors.selectIsExportInProgress) return false;
      return undefined;
    });

    const { result } = renderHook(() => useExportAppearance());

    expect(result.current.isExportInProgress).toBe(false);
  });

  test('onExportClick should dispatch exportAppearances action', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useExportAppearance());

    act(() => {
      result.current.onExportClick();
    });

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(AppearanceActions.exportAppearances).toHaveBeenCalled();
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'EXPORT_APPEARANCES' });
  });
});
