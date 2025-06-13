import { Inconsolata, Inter, Montserrat } from 'next/font/google';

export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-montserrat',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-inter',
});

export const inconsolata = Inconsolata({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-inconsolata',
});
