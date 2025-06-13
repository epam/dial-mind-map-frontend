import { renderHook } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';

import { useBuilderDispatch } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { isClientSessionValid } from '@/utils/auth/session';

import { useSourcesInitializer } from '../useSourcesInitializer';

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock('@/utils/auth/session', () => ({
  isClientSessionValid: jest.fn(),
}));

describe('useSourcesInitializer', () => {
  let mockDispatch: jest.Mock;
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockSearchParams = new URLSearchParams();
    (useBuilderDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not dispatch actions if session is invalid', () => {
    (isClientSessionValid as jest.Mock).mockReturnValue(false);
    renderHook(() => useSourcesInitializer());

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should set theme if it exists in search params', () => {
    (isClientSessionValid as jest.Mock).mockReturnValue(true);
    mockSearchParams.set('theme', 'dark');
    renderHook(() => useSourcesInitializer());

    expect(mockDispatch).toHaveBeenCalledWith(UIActions.setTheme('dark'));
  });
});
