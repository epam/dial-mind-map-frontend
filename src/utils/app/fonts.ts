import { montserrat } from '@/fonts/fonts';

import { getAppearanceFileUrl } from './themes';

export function isWebFontLoaded(fontFamily: string): boolean {
  if (typeof document === 'undefined' || !document.fonts) return false;

  if (fontFamily === montserrat.style.fontFamily.split(',').at(0)) return true;

  return [...(document.fonts as any)].some(
    fontFace => fontFace.family.replace(/['"]/g, '') === fontFamily && fontFace.status === 'loaded',
  );
}

export function getFontUrl(
  fontFamily: string,
  fontFileName: string | undefined,
  applicationName: string,
  theme: any,
): string | undefined {
  if (fontFileName) {
    return getAppearanceFileUrl(applicationName, theme, fontFileName);
  } else if (fontFamily) {
    return `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
  }
  return undefined;
}
