'use client';

import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect } from 'react';

import Loader from '@/components/common/Loader';

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

  return (
    <div className="flex size-full min-h-screen min-w-full flex-col items-center justify-center gap-7 bg-layer-1 text-center text-primary">
      <Loader size={48} />
      <div className="flex flex-col gap-4">
        <div className="text-[20px]">Signing in...</div>
        <div className="text-sm text-secondary">Please wait while we authenticate your account.</div>
      </div>
    </div>
  );
};

export default SignInPage;
