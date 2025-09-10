'use client';

import { useEffect } from 'react';

export function CustomFontLoader({ fontUrl, fontFamily }: { fontUrl: string; fontFamily: string }) {
  useEffect(() => {
    const loadFont = async () => {
      try {
        const font = new FontFace(fontFamily, `url("${fontUrl}")`);
        await font.load();
        document.fonts.add(font);
      } catch (err) {
        console.error('Failed to load custom font:', err);
      }
    };

    loadFont();
  }, [fontUrl]);

  return null;
}
