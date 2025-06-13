import { render, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

import SignInPage from '../page';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

describe('SignInPage', () => {
  let mockUpdateSession: jest.Mock;
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    mockUpdateSession = jest.fn().mockResolvedValue({ error: null });
    mockSearchParams = new URLSearchParams();

    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
      update: mockUpdateSession,
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    global.window.close = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call signIn if session is not authenticated', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdateSession,
    });
    mockSearchParams.set('authProvider', 'github');

    render(<SignInPage />);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('github', {
        callbackUrl: expect.stringContaining('&redirect=true'),
        prompt: 'none',
      });
    });
  });

  it('should close window if session is authenticated and redirect param is set', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'John Doe' } },
      status: 'authenticated',
      update: mockUpdateSession,
    });
    mockSearchParams.set('redirect', 'true');

    render(<SignInPage />);

    await waitFor(() => {
      expect(global.window.close).toHaveBeenCalled();
    });
  });

  it('should update session if authenticated and no redirect param', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'John Doe' } },
      status: 'authenticated',
      update: mockUpdateSession,
    });

    render(<SignInPage />);

    await waitFor(() => {
      expect(mockUpdateSession).toHaveBeenCalled();
    });
  });

  it('should close window if updated session has no error', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'John Doe' } },
      status: 'authenticated',
      update: mockUpdateSession,
    });

    render(<SignInPage />);

    await waitFor(() => {
      expect(mockUpdateSession).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(global.window.close).toHaveBeenCalled();
    });
  });

  it('should call signIn with undefined if authProvider is not set in search params', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdateSession,
    });

    render(<SignInPage />);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(undefined, {
        callbackUrl: expect.stringContaining('&redirect=true'),
        prompt: 'none',
      });
    });
  });
});
