import { render, screen } from '@testing-library/react';

import { useBuilderSelector } from '@/store/builder/hooks';

import { GeneratingLoaderView } from '../GeneratingLoaderView';

jest.mock('@/store/builder/hooks', () => ({
  useBuilderSelector: jest.fn(),
}));

jest.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: () => <div data-testid="dotlottie-mock" role="img" />,
}));

describe('GeneratingLoaderView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders title and details from store', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue({
      title: 'Generating Title',
      details: 'Generating Details',
    });

    render(<GeneratingLoaderView />);

    expect(screen.getByText('Generating Title')).toBeInTheDocument();
    expect(screen.getByText('Generating Details')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument(); // Lottie renders as <img> internally
  });

  test('renders fallback text when details are missing', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue({
      title: 'Generating Title',
      details: null,
    });

    render(<GeneratingLoaderView />);

    expect(screen.getByText('Generating Title')).toBeInTheDocument();
    expect(screen.getByText('In progress...')).toBeInTheDocument();
  });
});
