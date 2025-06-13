import { fireEvent, render, screen } from '@testing-library/react';

import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch } from '@/store/builder/hooks';
import { useBuilderSelector } from '@/store/builder/hooks';
import { GenerationStatus } from '@/types/sources';

import { GeneratingErrorView } from '../GeneratingErrorView';

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

jest.mock('@tabler/icons-react', () => ({
  IconAlertTriangle: () => <div data-testid="alert-icon" />,
}));

describe('GeneratingErrorView', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useBuilderDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  test('renders title and custom message', () => {
    render(<GeneratingErrorView title="Error Title" message="Custom error message" />);

    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  test('renders default message when message prop is missing', () => {
    render(<GeneratingErrorView title="Error Title" />);
    expect(
      screen.getByText(/an error occurred during graph generation\. please review your documents and try again\./i),
    ).toBeInTheDocument();
  });

  test('dispatches actions on button click with NOT_STARTED status', () => {
    render(<GeneratingErrorView title="Error Title" />);

    const button = screen.getByRole('button', { name: /return to sources/i });
    fireEvent.click(button);

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith(BuilderActions.setGenerationStatus(GenerationStatus.NOT_STARTED));
    expect(mockDispatch).toHaveBeenCalledWith(BuilderActions.setGeneratingStatus({ title: 'Graph generation' }));
  });

  test('dispatches actions on button click with FINISHED status', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue(true);

    render(<GeneratingErrorView title="Error Title" />);

    const button = screen.getByRole('button', { name: /return to sources/i });
    fireEvent.click(button);

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith(BuilderActions.setGenerationStatus(GenerationStatus.FINISHED));
    expect(mockDispatch).toHaveBeenCalledWith(BuilderActions.setGeneratingStatus({ title: 'Graph generation' }));
  });
});
