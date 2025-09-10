'use client';

import { useEffect } from 'react';

interface GoogleFontPreloaderProps {
  fontFamily: string;
  eagerLoadStyles?: Array<{
    weight?: number | string;
    style?: 'normal' | 'italic' | 'oblique';
    size?: string;
  }>;
}

export function GoogleFontPreloader({ fontFamily, eagerLoadStyles = [{ weight: 400 }] }: GoogleFontPreloaderProps) {
  useEffect(() => {
    const preloadFonts = async () => {
      if (typeof window === 'undefined' || !('fonts' in document)) return;

      const promises = eagerLoadStyles.map(style => {
        const weight = style.weight ?? 400;
        const fontStyle = style.style ?? 'normal';
        const size = style.size ?? '16px';

        const descriptor = `${fontStyle} ${weight} ${size} "${fontFamily}"`;
        return document.fonts.load(descriptor);
      });

      try {
        await Promise.all(promises);
      } catch (err) {
        console.error('Failed to preload Google Fonts:', err);
      }
    };

    preloadFonts();
  }, [fontFamily, eagerLoadStyles]);

  return null;
}
