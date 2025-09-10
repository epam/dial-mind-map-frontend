import { act, renderHook } from '@testing-library/react';
import { ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';

import { useImportAppearance } from '../useImportApperance';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('@/store/builder/hooks', () => ({
  useBuilderSelector: jest.fn(),
}));

jest.mock('@/store/builder/appearance/appearance.reducers', () => ({
  AppearanceActions: {
    importAppearances: jest.fn(),
  },
  AppearanceSelectors: {
    selectIsImportInProgress: jest.fn(),
  },
}));

describe('useImportAppearance', () => {
  let dispatchMock: jest.Mock;

  beforeEach(() => {
    dispatchMock = jest.fn();
    (useDispatch as unknown as jest.Mock).mockReturnValue(dispatchMock);
    (AppearanceActions.importAppearances as unknown as jest.Mock).mockReturnValue({ type: 'IMPORT_APPEARANCES' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return isImportInProgress as true when selector returns true', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === AppearanceSelectors.selectIsImportInProgress) return true;
      return undefined;
    });

    const { result } = renderHook(() => useImportAppearance());

    expect(result.current.isImportInProgress).toBe(true);
  });

  test('should return isImportInProgress as false when selector returns false', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === AppearanceSelectors.selectIsImportInProgress) return false;
      return undefined;
    });

    const { result } = renderHook(() => useImportAppearance());

    expect(result.current.isImportInProgress).toBe(false);
  });

  test('onImportClick should trigger click on file input ref', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useImportAppearance());

    // Mock the file input element
    const clickMock = jest.fn();
    Object.defineProperty(result.current.fileInputRef, 'current', {
      writable: true,
      value: { click: clickMock },
    });

    act(() => {
      result.current.onImportClick();
    });

    expect(clickMock).toHaveBeenCalledTimes(1);
  });

  test('onFileChange should not dispatch when no file selected', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useImportAppearance());

    const event = { target: { files: [] } } as unknown as ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.onFileChange(event);
    });

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  test('onFileChange should dispatch importAppearances action when file selected', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useImportAppearance());

    const mockFile = new File(['content'], 'test.json', { type: 'application/json' });
    const event = { target: { files: [mockFile] } } as unknown as ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.onFileChange(event);
    });

    expect(AppearanceActions.importAppearances).toHaveBeenCalledWith({ file: mockFile });
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'IMPORT_APPEARANCES' });
  });
});
