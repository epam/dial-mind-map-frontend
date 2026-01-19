import { useDocumentVisibility } from 'ahooks';
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AuthUiMode } from '@/types/auth';
import { isClientSessionValid } from '@/utils/auth/session';

export const useAuth = (
  redirectToSignIn: boolean,
  resetRedirectStatus: () => void,
  isAllowApiKeyAuth = false,
  authUiMode: AuthUiMode,
  isAllowedAuthProvider = false,
) => {
  const [shouldUpdateSession, setShouldUpdateSession] = useState(false);
  const [shouldLogin, setShouldLogin] = useState(false);
  const { data: session, status: sessionStatus, update } = useSession();
  const searchParams = useSearchParams();
  const authWindowRef = useRef<Window | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const hasOpenedWindowRef = useRef(false);

  const documentVisibility = useDocumentVisibility();

  useEffect(() => {
    if (isAllowApiKeyAuth) return;
    if (shouldUpdateSession) {
      setShouldUpdateSession(false);
      window.location.reload();
    }
  }, [shouldUpdateSession, update, isAllowApiKeyAuth]);

  const openAuthWindow = useCallback(() => {
    const authProvider = searchParams.get('authProvider');
    const theme = searchParams.get('theme') || 'dark';
    if (!authProvider || !isAllowedAuthProvider) return;
    if (sessionStatus === 'loading' || isAllowApiKeyAuth) return;

    const needsAuth = sessionStatus === 'unauthenticated' || redirectToSignIn || !isClientSessionValid(session);

    if (authWindowRef.current) return;

    if (authUiMode === AuthUiMode.SameWindow && authProvider && needsAuth) {
      signIn(authProvider, {
        callbackUrl: window.location.href,
      });
      return;
    }

    if (needsAuth && !isWindowOpen && !hasOpenedWindowRef.current) {
      // Ensure the document is visible before opening a new window
      if (documentVisibility !== 'visible') return;

      authWindowRef.current = window.open(
        `/signin?authProvider=${authProvider}&theme=${theme}`,
        '_blank',
        authUiMode === AuthUiMode.Popup ? `width=${window.outerWidth},height=${window.outerHeight}` : undefined,
      );

      hasOpenedWindowRef.current = true;
      setIsWindowOpen(true);

      if (redirectToSignIn && authWindowRef.current) {
        resetRedirectStatus();
      }
    }
  }, [
    isAllowApiKeyAuth,
    isWindowOpen,
    redirectToSignIn,
    resetRedirectStatus,
    searchParams,
    session,
    sessionStatus,
    documentVisibility,
    authWindowRef,
    authUiMode,
    isAllowedAuthProvider,
  ]);

  useEffect(() => {
    openAuthWindow();
  }, [openAuthWindow]);

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

  const onLogin = useCallback(() => {
    setIsWindowOpen(false);
    authWindowRef.current = null;
    hasOpenedWindowRef.current = false;
    openAuthWindow();
  }, [openAuthWindow]);

  return {
    session,
    sessionStatus,
    shouldLogin,
    setShouldLogin,
    shouldUpdateSession,
    setShouldUpdateSession,
    onLogin,
    openAuthWindow,
  };
};
