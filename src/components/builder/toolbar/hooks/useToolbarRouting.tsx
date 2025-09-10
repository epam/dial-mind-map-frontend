import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';

export function useToolbarRouting() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const applicationName = useBuilderSelector(ApplicationSelectors.selectApplicationName);
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';

  const getRouteQuery = useCallback(() => {
    const authProvider = searchParams.get('authProvider');
    const parts = [
      applicationName ? `id=${applicationName}` : '',
      authProvider ? `authProvider=${authProvider}` : '',
      theme ? `theme=${theme}` : '',
    ];
    return parts.filter(Boolean).join('&');
  }, [searchParams, applicationName, theme]);

  return { pathname, getRouteQuery };
}
