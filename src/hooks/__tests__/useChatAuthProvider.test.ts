import { renderHook } from '@testing-library/react';
import * as nextNavigation from 'next/navigation';

import { useChatAuthProvider } from '../useChatAuthProvider';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

const createMockSearchParams = (params: Record<string, string>) =>
  ({
    get: (key: string) => params[key] ?? null,
  }) as unknown as ReturnType<typeof nextNavigation.useSearchParams>;

describe('useChatAuthProvider', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns chatAuthProvider from URL', () => {
    (nextNavigation.useSearchParams as jest.Mock).mockReturnValue(createMockSearchParams({ authProvider: 'google' }));

    const { result } = renderHook(() => useChatAuthProvider({ isAllowApiKeyAuth: false, providers: ['google'] }));

    expect(result.current.chatAuthProvider).toBe('google');
  });

  it('allows provider if isAllowApiKeyAuth is true', () => {
    (nextNavigation.useSearchParams as jest.Mock).mockReturnValue(createMockSearchParams({}));

    const { result } = renderHook(() => useChatAuthProvider({ isAllowApiKeyAuth: true, providers: [] }));

    expect(result.current.isAllowProvider).toBe(true);
  });

  it('allows provider if authProvider is in providers list', () => {
    (nextNavigation.useSearchParams as jest.Mock).mockReturnValue(createMockSearchParams({ authProvider: 'github' }));

    const { result } = renderHook(() => useChatAuthProvider({ isAllowApiKeyAuth: false, providers: ['github'] }));

    expect(result.current.isAllowProvider).toBe(true);
  });

  it('denies provider if not allowed and not in providers list', () => {
    (nextNavigation.useSearchParams as jest.Mock).mockReturnValue(createMockSearchParams({ authProvider: 'facebook' }));

    const { result } = renderHook(() => useChatAuthProvider({ isAllowApiKeyAuth: false, providers: ['google'] }));

    expect(result.current.isAllowProvider).toBe(false);
  });

  it('denies provider if no authProvider and isAllowApiKeyAuth is false', () => {
    (nextNavigation.useSearchParams as jest.Mock).mockReturnValue(createMockSearchParams({}));

    const { result } = renderHook(() => useChatAuthProvider({ isAllowApiKeyAuth: false, providers: ['google'] }));

    expect(result.current.isAllowProvider).toBe(false);
  });
});
