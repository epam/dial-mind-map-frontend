import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';

import { HistoryActions } from '@/store/builder/history/history.reducers';
import { useBuilderDispatch } from '@/store/builder/hooks';

import { useHistoryHotKeys } from '../useHistoryHotKeys';

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

describe('useHistoryHotKeys', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useBuilderDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should dispatch undo action when Ctrl+Z or Cmd+Z is pressed', () => {
    renderHook(() => useHistoryHotKeys());

    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

    expect(mockDispatch).toHaveBeenCalledWith(HistoryActions.applyAction('undo'));
  });

  it('should dispatch redo action when Ctrl+Shift+Z or Cmd+Shift+Z is pressed', () => {
    renderHook(() => useHistoryHotKeys());

    fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: true });

    expect(mockDispatch).toHaveBeenCalledWith(HistoryActions.applyAction('redo'));
  });
});
