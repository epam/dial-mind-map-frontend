import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export const useAuth = (redirectToSignIn: boolean, resetRedirectStatus: () => void, isAllowApiKeyAuth = false) => {
  const [shouldUpdateSession, setShouldUpdateSession] = useState(false);
  const [shouldLogin, setShouldLogin] = useState(false);
  const { data: session, status: sessionStatus, update } = useSession();
  const searchParams = useSearchParams();
  const authWindowRef = useRef<Window | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  useEffect(() => {
    if (isAllowApiKeyAuth) return;
    if (shouldUpdateSession) {
      setShouldUpdateSession(false);
      window.location.reload();
    }
  }, [shouldUpdateSession, update, isAllowApiKeyAuth]);

  useEffect(() => {
    if (sessionStatus === 'loading' || !shouldLogin || isAllowApiKeyAuth) return;

    if ((sessionStatus === 'unauthenticated' || redirectToSignIn) && !isWindowOpen) {
      if (redirectToSignIn) {
        resetRedirectStatus();
      }
      setIsWindowOpen(true);

      const authProvider = searchParams.get('authProvider');
      authWindowRef.current = window.open(
        `/signin?authProvider=${authProvider}`,
        '_blank',
        `width=${window.outerWidth},height=${window.outerHeight}`,
      );
    }
  }, [
    sessionStatus,
    shouldLogin,
    searchParams,
    redirectToSignIn,
    resetRedirectStatus,
    isWindowOpen,
    isAllowApiKeyAuth,
  ]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_WINDOW_CLOSED') {
        setShouldUpdateSession(true);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    session,
    sessionStatus,
    shouldLogin,
    setShouldLogin,
    shouldUpdateSession,
    setShouldUpdateSession,
  };
};
