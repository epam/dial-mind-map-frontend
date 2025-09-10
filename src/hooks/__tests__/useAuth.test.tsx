import { act, renderHook } from '@testing-library/react';
import { useDocumentVisibility } from 'ahooks';
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

import { AuthUiMode } from '@/types/auth';

import { useAuth } from '../useAuth';

jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('ahooks', () => ({
  useDocumentVisibility: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

jest.useFakeTimers();

describe('useAuth', () => {
  const resetRedirectStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useDocumentVisibility as jest.Mock).mockReturnValue('visible');

    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue('testProvider'),
    });

    global.window.open = jest.fn().mockReturnValue({ closed: true });
    delete (window as any).location;
    window.location = {
      ...window.location,
      reload: jest.fn(),
    };
  });

  test('opens window when session is invalid and redirectToSignIn is false', () => {
    renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Popup, true));

    expect(window.open).toHaveBeenCalledWith(
      '/signin?authProvider=testProvider&theme=testProvider',
      '_blank',
      expect.stringContaining('width='),
    );
  });

  test('does open table window when authUiMode is Tab', () => {
    renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Tab, true));

    expect(window.open).toHaveBeenCalledWith(
      '/signin?authProvider=testProvider&theme=testProvider',
      '_blank',
      undefined,
    );
  });

  test('does should call signIn when authUiMode is SameWindow', () => {
    const { result } = renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.SameWindow, true));
    act(() => {
      result.current.openAuthWindow();
    });

    expect(window.open).not.toHaveBeenCalled();
    expect(signIn).toHaveBeenCalledWith('testProvider', {
      callbackUrl: window.location.href,
    });
  });

  test('does not open window if document is hidden', () => {
    (useDocumentVisibility as jest.Mock).mockReturnValueOnce('hidden');

    renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Popup, true));

    expect(window.open).not.toHaveBeenCalled();
  });

  test('does not open window if isAllowApiKeyAuth is true', () => {
    renderHook(() => useAuth(false, resetRedirectStatus, true, AuthUiMode.Popup, true));
    expect(window.open).not.toHaveBeenCalled();
  });

  test('onLogin triggers window open again', () => {
    const { result } = renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Popup, true));

    act(() => {
      result.current.onLogin();
    });

    expect(window.open).toHaveBeenCalledTimes(2);
  });

  test('calls resetRedirectStatus if redirectToSignIn is true', () => {
    renderHook(() => useAuth(true, resetRedirectStatus, false, AuthUiMode.Popup, true));

    expect(window.open).toHaveBeenCalled();
    expect(resetRedirectStatus).toHaveBeenCalled();
  });

  test('reloads page when shouldUpdateSession becomes true', () => {
    const mockUpdate = jest.fn();
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'authenticated',
      update: mockUpdate,
    });

    const { result } = renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Popup, true));

    act(() => {
      result.current.setShouldUpdateSession(true);
    });

    expect(window.location.reload).toHaveBeenCalled();
    expect(result.current.shouldUpdateSession).toBe(false);
  });

  test('handles AUTH_WINDOW_CLOSED message: sets flag and reloads page', () => {
    const { result } = renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Popup, true));

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'AUTH_WINDOW_CLOSED' },
        }),
      );
    });

    expect(window.location.reload).toHaveBeenCalled();

    expect(result.current.shouldUpdateSession).toBe(false);
  });

  it('does not call window.open a second time if authWindowRef.current is truthy', () => {
    (global.window.open as jest.Mock).mockReturnValue({});

    const { result } = renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Popup, true));

    expect(window.open).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.openAuthWindow();
    });

    expect(window.open).toHaveBeenCalledTimes(1);
  });

  test('default isAllowApiKeyAuth is false (omitting the third arg)', () => {
    (useDocumentVisibility as jest.Mock).mockReturnValueOnce('visible');
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Popup, true));

    expect(window.open).toHaveBeenCalledTimes(1);
  });

  test('does not open auth window if isAllowedAuthProvider is false', () => {
    renderHook(() => useAuth(false, resetRedirectStatus, false, AuthUiMode.Popup, false));

    expect(window.open).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
  });
});
