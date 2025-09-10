import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import React from 'react';

import { useBuilderDispatch } from '@/store/builder/hooks';
import { CreateSource } from '@/types/sources';

import { EmptyTableState } from '../EmptyTableState';

jest.mock('../SourceActions', () => ({
  SourceActions: ({ isValid, editableIndex, handleAddSource, handleSelectFiles }: any) => (
    <div
      data-testid="source-actions"
      data-is-valid={isValid}
      data-editable-index={editableIndex !== null ? editableIndex.toString() : ''}
      data-handle-add={typeof handleAddSource === 'function' ? 'true' : 'false'}
      data-handle-select={typeof handleSelectFiles === 'function' ? 'true' : 'false'}
    />
  ),
}));

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

describe('EmptyTableState component', () => {
  const columnsCount = 4;
  const isValid = true;
  const editableIndex = 2;
  const mockAddSource = jest.fn<Promise<void>, [CreateSource]>();
  const mockSelectFiles = jest.fn<void, [React.ChangeEvent<HTMLInputElement>]>();

  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useBuilderDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  test('renders the empty state texts and icon', () => {
    render(
      <table>
        <tbody>
          <EmptyTableState
            columnsCount={columnsCount}
            isValid={isValid}
            editableIndex={editableIndex}
            handleAddSource={mockAddSource}
            handleSelectFiles={mockSelectFiles}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText(/add sources to get started!/i)).toBeInTheDocument();
    expect(screen.getByText(/create a list of sources to generate the starting graph/i)).toBeInTheDocument();

    const td = screen.getByText(/add sources to get started!/i).closest('td');
    expect(td).toHaveAttribute('colspan', columnsCount.toString());
  });

  test('passes correct props to SourceActions', () => {
    render(
      <table>
        <tbody>
          <EmptyTableState
            columnsCount={columnsCount}
            isValid={isValid}
            editableIndex={editableIndex}
            handleAddSource={mockAddSource}
            handleSelectFiles={mockSelectFiles}
          />
        </tbody>
      </table>,
    );

    const actions = screen.getByTestId('source-actions');
    expect(actions).toHaveAttribute('data-is-valid', 'true');
    expect(actions).toHaveAttribute('data-editable-index', editableIndex.toString());
    expect(actions).toHaveAttribute('data-handle-add', 'true');
    expect(actions).toHaveAttribute('data-handle-select', 'true');
  });
});
