import '../globals.css';

import classNames from 'classnames';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';

import SessionProvider from '@/components/common/auth/SessionProvider';
import { inter } from '@/fonts/fonts';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get the theme from the request headers or default to 'dark'
  const url = new URL((await headers()).get('x-url') || 'http://localhost');
  const theme = url.searchParams.get('theme') || 'dark';

  const session = await getServerSession();
  return (
    <html lang="en" className={theme} data-color-mode={theme}>
      <head>{!!process.env.THEMES_CONFIG_HOST && <link rel="stylesheet" href={'api/themes/styles'} />}</head>

      <SessionProvider session={session}>
        <body className={classNames([inter.variable, 'font', 'h-full'])}>{children}</body>
      </SessionProvider>
    </html>
  );
}
