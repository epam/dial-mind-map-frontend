import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { startTransition, useEffect, useOptimistic } from 'react';

export const useRedirecting = (router: AppRouterInstance) => {
  const [isRedirect, setIsRedirect] = useOptimistic(false);

  useEffect(() => {
    if (router.push.name === 'patched') return;
    const { push } = router;
    router.push = function patched(...args) {
      startTransition(() => {
        setIsRedirect(true);
      });
      push.apply(history, args);
    };
  }, [router, setIsRedirect]);

  return [isRedirect];
};
