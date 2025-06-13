import { render, renderHook, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';

import { useBuilderDispatch } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';

import { useEditorHotkeys } from '../useEditorHotkeys';

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

describe('useEditorHotkeys', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useBuilderDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should focus search input when Ctrl+F or Cmd+F is pressed', () => {
    render(<input type="text" id="search-input" role="textbox" />);
    renderHook(() => useEditorHotkeys());

    const searchInput = screen.getByRole('textbox');
    jest.spyOn(searchInput, 'focus');

    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });

    expect(searchInput.focus).toHaveBeenCalled();
  });

  it('should dispatch UI action to close node editor when Escape key is pressed', () => {
    renderHook(() => useEditorHotkeys());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockDispatch).toHaveBeenCalledWith(UIActions.setIsNodeEditorOpen(false));
  });
});
