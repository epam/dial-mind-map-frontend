'use client';

import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect } from 'react';

const SignInPage = () => {
  const session = useSession();
  const searchParams = useSearchParams();

  const updateSession = useCallback(async () => {
    const updatedSession = await session.update();
    if (updatedSession && !updatedSession.error) {
      window.opener?.postMessage({ type: 'AUTH_WINDOW_CLOSED' }, '*');
      window.close();
    }
  }, [session]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      window.opener?.postMessage({ type: 'AUTH_WINDOW_CLOSED' }, '*');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (session.status !== 'loading' && (session.data?.error || !session.data)) {
      signIn(searchParams.get('authProvider') ?? undefined, {
        callbackUrl: `${window.location.href}&redirect=true`,
        prompt: 'none',
      });
      return;
    }
    if (session.status === 'authenticated') {
      const redirect = searchParams.get('redirect');
      if (redirect) {
        window.opener?.postMessage({ type: 'AUTH_WINDOW_CLOSED' }, '*');
        window.close();
      } else {
        updateSession();
      }
    }
  }, [session, searchParams, updateSession]);

  return null;
};

export default SignInPage;
