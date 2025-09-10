'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

import { ApplicationActions, ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';

export const useApplicationInitializer = () => {
  const dispatch = useBuilderDispatch();
  const searchParams = useSearchParams();
  const name = useBuilderSelector(ApplicationSelectors.selectApplicationName);
  const isApplicationReady = useBuilderSelector(ApplicationSelectors.selectIsApplicationReady);
  const theme = searchParams.get('theme');
  const id = useMemo(() => searchParams.get('id'), [searchParams]);
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (!name && id && !didFetchRef.current && !isApplicationReady) {
      didFetchRef.current = true;
      dispatch(ApplicationActions.fetchApplicationStart(id));
    }
  }, [dispatch, name, id, isApplicationReady]);

  useEffect(() => {
    if (theme) {
      dispatch(UIActions.setTheme(theme));
    }
  }, [theme, dispatch]);
};
