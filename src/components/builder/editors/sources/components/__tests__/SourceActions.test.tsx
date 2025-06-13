import { fireEvent, render, screen } from '@testing-library/react';

import { SourceActions } from '../SourceActions';

describe('SourceActions', () => {
  const mockAddSource = jest.fn();
  const mockSelectFiles = jest.fn();

  const renderComponent = (isValid: boolean, editableIndex: number | null = null) => {
    render(
      <SourceActions
        isValid={isValid}
        editableIndex={editableIndex}
        handleAddSource={mockAddSource}
        handleSelectFiles={mockSelectFiles}
      />,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Add link and Upload file buttons', () => {
    renderComponent(true);
    expect(screen.getByText(/add link/i)).toBeInTheDocument();
    expect(screen.getByText(/upload file/i)).toBeInTheDocument();
  });

  test('calls handleAddSource with correct params on Add link click', () => {
    renderComponent(true);
    fireEvent.click(screen.getByText(/add link/i));
    expect(mockAddSource).toHaveBeenCalledWith({ link: '' });
  });

  test('Add link is disabled if isValid is false', () => {
    renderComponent(false);
    const button = screen.getByText(/add link/i).closest('button');
    expect(button).toBeDisabled();
  });

  test('Add link is disabled if editableIndex is not null', () => {
    renderComponent(true, 1);
    const button = screen.getByText(/add link/i).closest('button');
    expect(button).toBeDisabled();
  });

  test('Upload file input is disabled when isValid is false', () => {
    renderComponent(false);
    const input = screen.getByLabelText('upload file');
    expect(input).toBeDisabled();
  });

  test('calls handleSelectFiles on file input change', () => {
    renderComponent(true);
    const input = screen.getByLabelText('upload file');
    const file = new File(['dummy content'], 'example.txt', { type: 'text/plain' });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(mockSelectFiles).toHaveBeenCalled();
  });

  test('Upload file label is not clickable when editableIndex is not null', () => {
    renderComponent(true, 0);
    const label = screen.getByText(/upload file/i).closest('label');
    expect(label).toHaveClass('pointer-events-none');
  });
});
