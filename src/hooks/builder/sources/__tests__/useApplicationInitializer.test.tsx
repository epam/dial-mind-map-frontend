import { renderHook } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';

import { ApplicationActions, ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';

import { useApplicationInitializer } from '../useApplicationInitializer';

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

describe('useApplicationInitializer', () => {
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

  it('should dispatch fetchApplicationStart when id exists and name is absent and application is not ready', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === ApplicationSelectors.selectApplicationName) return '';
      if (selector === ApplicationSelectors.selectIsApplicationReady) return false;
      return undefined;
    });
    mockSearchParams.set('id', '123');

    renderHook(() => useApplicationInitializer());

    expect(mockDispatch).toHaveBeenCalledWith(ApplicationActions.fetchApplicationStart('123'));
  });

  it('should not dispatch fetchApplicationStart more than once on rerender', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === ApplicationSelectors.selectApplicationName) return '';
      if (selector === ApplicationSelectors.selectIsApplicationReady) return false;
      return undefined;
    });
    mockSearchParams.set('id', '123');

    const { rerender } = renderHook(() => useApplicationInitializer());
    rerender();

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('should not dispatch fetchApplicationStart if name exists', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === ApplicationSelectors.selectApplicationName) return 'app-name';
      if (selector === ApplicationSelectors.selectIsApplicationReady) return false;
      return undefined;
    });
    mockSearchParams.set('id', '123');

    renderHook(() => useApplicationInitializer());

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not dispatch fetchApplicationStart if application is already ready', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === ApplicationSelectors.selectApplicationName) return '';
      if (selector === ApplicationSelectors.selectIsApplicationReady) return true;
      return undefined;
    });
    mockSearchParams.set('id', '123');

    renderHook(() => useApplicationInitializer());

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not dispatch fetchApplicationStart if id is missing', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === ApplicationSelectors.selectApplicationName) return '';
      if (selector === ApplicationSelectors.selectIsApplicationReady) return false;
      return undefined;
    });

    renderHook(() => useApplicationInitializer());

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should set theme if it exists in search params', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue('irrelevant');
    mockSearchParams.set('theme', 'dark');
    renderHook(() => useApplicationInitializer());

    expect(mockDispatch).toHaveBeenCalledWith(UIActions.setTheme('dark'));
  });
});
