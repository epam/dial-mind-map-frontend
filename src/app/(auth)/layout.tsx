import classNames from 'classnames';
import { getServerSession } from 'next-auth';

import SessionProvider from '@/components/common/auth/SessionProvider';
import { inter } from '@/fonts/fonts';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <SessionProvider session={session}>
        <body className={classNames([inter.variable, 'font', 'h-full'])}>{children}</body>
      </SessionProvider>
    </html>
  );
}
