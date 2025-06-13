import { render, screen } from '@testing-library/react';

import { AuthProviderError } from '../AuthProviderError';

describe('AuthProviderError', () => {
  test('renders error message with unsupported provider and supported providers list', () => {
    const provider = 'Google';
    const availableProviders = ['GitHub', 'Twitter'];

    render(<AuthProviderError provider={provider} availableProviders={availableProviders} />);

    const joinedProviders = '“GitHub” or “Twitter”';

    expect(
      screen.getByText(
        new RegExp(
          `please sign in to the dial by ${joinedProviders} to use Mind Map\\. your current authorization method “${provider}” is not supported\\.`,
          'i',
        ),
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
