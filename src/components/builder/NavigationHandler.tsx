'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';

export const NavigationHandler = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dispatch = useBuilderDispatch();
  const navigationTarget = useBuilderSelector(UISelectors.selectNavigationTarget);

  useEffect(() => {
    if (!navigationTarget) return;

    if (pathname === `/${navigationTarget}`) {
      dispatch(UIActions.softNavigateTo());
      return;
    }

    const query = searchParams.toString();
    const fullUrl = query ? `/${navigationTarget}?${query}` : `/${navigationTarget}`;

    router.push(fullUrl);

    dispatch(UIActions.softNavigateTo());
  }, [navigationTarget, pathname]);

  return null;
};
