import { Column } from '@tanstack/react-table';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { SearchInput } from '../SearchInput';

const mockSetFilterValue = jest.fn();
const mockColumn = {
  getFilterValue: () => '',
  setFilterValue: mockSetFilterValue,
} as unknown as Column<unknown, unknown>;

describe('SearchInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search icon', () => {
    render(<SearchInput column={mockColumn} setIsOpen={jest.fn()} isOpen={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('shows badge when filter value exists', () => {
    const columnWithValue = {
      getFilterValue: () => 'test',
      setFilterValue: mockSetFilterValue,
    } as unknown as Column<unknown, unknown>;

    render(<SearchInput column={columnWithValue} setIsOpen={jest.fn()} isOpen={false} />);
    expect(screen.getByTestId('bubble-badge')).toBeInTheDocument();
  });

  test('calls setIsOpen(true) when icon is clicked', () => {
    const setIsOpen = jest.fn();
    render(<SearchInput column={mockColumn} setIsOpen={setIsOpen} isOpen={false} />);
    fireEvent.mouseUp(screen.getByRole('button'));
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });

  test('focuses input when isOpen is true', () => {
    render(<SearchInput column={mockColumn} setIsOpen={jest.fn()} isOpen={true} />);
    expect(screen.getByPlaceholderText('Search...')).toHaveFocus();
  });

  test('calls column.setFilterValue on input change', () => {
    render(<SearchInput column={mockColumn} setIsOpen={jest.fn()} isOpen={true} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(mockSetFilterValue).toHaveBeenCalledWith('hello');
  });

  test('calls setIsOpen(false) after blur delay', async () => {
    jest.useFakeTimers();
    const setIsOpen = jest.fn();
    render(<SearchInput column={mockColumn} setIsOpen={setIsOpen} isOpen={true} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.blur(input);
    jest.advanceTimersByTime(150);
    await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false));
    jest.useRealTimers();
  });

  test('calls column.setFilterValue with undefined when input is cleared', () => {
    render(<SearchInput column={mockColumn} setIsOpen={jest.fn()} isOpen={true} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(mockSetFilterValue).toHaveBeenCalledWith(undefined);
  });
});
