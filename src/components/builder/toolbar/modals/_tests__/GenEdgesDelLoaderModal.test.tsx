import { render, screen } from '@testing-library/react';

import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';

import { GenEdgesLoaderModal } from '../GenEdgesLoaderModal';

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

jest.mock('@/components/builder/common/Loader', () => {
  const MockLoader = () => <div>MockLoader</div>;
  MockLoader.displayName = 'MockLoader';
  return MockLoader;
});

describe('GenEdgesLoaderModal', () => {
  const dispatchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useBuilderDispatch as jest.Mock).mockReturnValue(dispatchMock);
  });

  test('renders loader and text when modal is open', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue(true);

    render(<GenEdgesLoaderModal />);
    expect(screen.getByText(/generating edges/i)).toBeInTheDocument();
    expect(screen.getByText(/mockloader/i)).toBeInTheDocument();
  });

  test('does not render content when modal is closed', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue(false);

    render(<GenEdgesLoaderModal />);
    expect(screen.queryByText(/generating edges/i)).not.toBeInTheDocument();
  });
});
