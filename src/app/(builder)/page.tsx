'use client';

import classNames from 'classnames';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { AuthActions, AuthSelectors } from '@/store/builder/auth/auth.slice';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';

export default function Home() {
  const dispatch = useBuilderDispatch();

  const redirectToSignIn = useBuilderSelector(AuthSelectors.selectRedirectToSignin);
  const resetRedirect = useCallback(() => dispatch(AuthActions.resetRedirect()), [dispatch]);

  const { session } = useAuth(redirectToSignIn, resetRedirect);
  const theme = useBuilderSelector(UISelectors.selectTheme);

  return (
    <div>
      <main className="row-start-2 flex flex-col items-center gap-8 bg-layer-3 px-3 py-4 sm:items-start md:p-4">
        <Link href="/sources" className="text-accent-primary">
          sources
        </Link>
        <Link href="/content" className="text-accent-primary">
          content
        </Link>
        <p>user email: {session?.user.email}</p>
        {session && (
          <button className="text-error" onClick={() => signOut()}>
            log out
          </button>
        )}
        <div className="flex gap-2">
          <button
            className={classNames([(!theme || theme === 'dark') && 'text-info'])}
            onClick={() => dispatch(UIActions.setTheme('dark'))}
          >
            dark
          </button>
          *
          <button
            className={classNames([theme === 'light' && 'text-info'])}
            onClick={() => dispatch(UIActions.setTheme('light'))}
          >
            light
          </button>
        </div>
      </main>
    </div>
  );
}
