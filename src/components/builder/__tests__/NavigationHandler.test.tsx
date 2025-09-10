import { render, waitFor } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';

import { NavigationHandler } from '../NavigationHandler';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

describe('NavigationHandler', () => {
  const dispatchMock = jest.fn();
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    (useBuilderDispatch as jest.Mock).mockReturnValue(dispatchMock);
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
  });

  test('does nothing when navigationTarget is undefined', async () => {
    (useBuilderSelector as jest.Mock).mockReturnValue(undefined);
    (usePathname as jest.Mock).mockReturnValue('/any');
    (useSearchParams as jest.Mock).mockReturnValue({ toString: () => 'a=1' });

    render(<NavigationHandler />);

    await waitFor(() => {
      expect(dispatchMock).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  test('soft navigates when already on target path', async () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === UISelectors.selectNavigationTarget) return 'sources';
      return undefined;
    });
    (usePathname as jest.Mock).mockReturnValue('/sources');
    (useSearchParams as jest.Mock).mockReturnValue({ toString: () => '' });

    render(<NavigationHandler />);

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(UIActions.softNavigateTo());
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  test('pushes router and soft navigates when path differs with query', async () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === UISelectors.selectNavigationTarget) return 'content';
      return undefined;
    });
    (usePathname as jest.Mock).mockReturnValue('/sources');
    (useSearchParams as jest.Mock).mockReturnValue({ toString: () => 'x=10&y=20' });

    render(<NavigationHandler />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/content?x=10&y=20');
      expect(dispatchMock).toHaveBeenCalledWith(UIActions.softNavigateTo());
    });
  });

  test('pushes router and soft navigates when path differs without query', async () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === UISelectors.selectNavigationTarget) return 'content';
      return undefined;
    });
    (usePathname as jest.Mock).mockReturnValue('/sources');
    (useSearchParams as jest.Mock).mockReturnValue({ toString: () => '' });

    render(<NavigationHandler />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/content');
      expect(dispatchMock).toHaveBeenCalledWith(UIActions.softNavigateTo());
    });
  });
});
