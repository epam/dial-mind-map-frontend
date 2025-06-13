import { act, renderHook, waitFor } from '@testing-library/react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { useRedirecting } from '../useRedirecting';

jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    useOptimistic: jest.fn(initialValue => {
      const [value, setValue] = actualReact.useState(initialValue);
      return [value, setValue];
    }),
  };
});

describe('useRedirecting', () => {
  let mockRouter: AppRouterInstance;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
    } as unknown as AppRouterInstance;
  });

  it('should return false initially', () => {
    const { result } = renderHook(() => useRedirecting(mockRouter));
    expect(result.current[0]).toBe(false);
  });

  it('should set isRedirect to true when push is called and preserve loading state', async () => {
    const { result } = renderHook(() => useRedirecting(mockRouter));

    act(() => {
      mockRouter.push('/new-route');
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(true);
    });
  });

  it('should not override push multiple times', () => {
    renderHook(() => useRedirecting(mockRouter));
    renderHook(() => useRedirecting(mockRouter));

    expect(mockRouter.push.name).toBe('patched');
  });
});
