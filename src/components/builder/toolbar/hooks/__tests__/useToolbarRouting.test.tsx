import { renderHook } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';

import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';

import { useToolbarRouting } from '../useToolbarRouting';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/store/builder/hooks', () => ({
  useBuilderSelector: jest.fn(),
}));

describe('useToolbarRouting', () => {
  const mockPath = '/builder';
  const mockParams = { get: jest.fn() };

  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue(mockPath);
    (useSearchParams as jest.Mock).mockReturnValue(mockParams);
    jest.clearAllMocks();
  });

  it('returns current pathname', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === ApplicationSelectors.selectApplicationName) return 'myApp';
      if (selector === UISelectors.selectTheme) return 'light';
      return undefined;
    });

    const { result } = renderHook(() => useToolbarRouting());
    expect(result.current.pathname).toBe(mockPath);
  });

  it('builds query string with all params', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === ApplicationSelectors.selectApplicationName) return 'app1';
      if (selector === UISelectors.selectTheme) return 'light';
      return undefined;
    });
    (mockParams.get as jest.Mock).mockImplementation(key => {
      if (key === 'authProvider') return 'provider1';
      return null;
    });

    const { result } = renderHook(() => useToolbarRouting());
    const query = result.current.getRouteQuery();
    expect(query).toBe('id=app1&authProvider=provider1&theme=light');
  });

  it('omits missing optional params and falls back theme to dark', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === ApplicationSelectors.selectApplicationName) return undefined;
      if (selector === UISelectors.selectTheme) return undefined;
      return undefined;
    });
    (mockParams.get as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useToolbarRouting());
    const query = result.current.getRouteQuery();
    expect(query).toBe('theme=dark');
  });
});
