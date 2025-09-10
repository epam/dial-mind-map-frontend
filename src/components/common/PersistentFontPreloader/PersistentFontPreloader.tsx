'use client';

import { useEffect } from 'react';

import { PERSISTENT_FONT_PRELOADER_ELEMENT_ID } from '@/constants/app';

/**
 * Persistent hidden span for preloading fonts used in canvas-based rendering (like Cytoscape).
 *
 * @param fontFamily - The font family to preload.
 * @param weight - Optional font weight (defaults to 400).
 * @param id - Optional element ID (defaults to "font-preload-span").
 */
export function PersistentFontPreloader({
  fontFamily,
  weight = 400,
  id = PERSISTENT_FONT_PRELOADER_ELEMENT_ID,
}: {
  fontFamily: string;
  weight?: number;
  id?: string;
}) {
  useEffect(() => {
    let el = document.getElementById(id);

    if (!el) {
      el = document.createElement('span');
      el.id = id;
      el.style.position = 'absolute';
      el.style.top = '-9999px';
      el.style.left = '-9999px';
      el.style.whiteSpace = 'nowrap';
      el.textContent = 'Preloading font';
      document.body.appendChild(el);
    }

    el.style.fontFamily = `"${fontFamily}"`;
    el.style.fontWeight = `${weight}`;
    el.textContent = 'Preloading font';

    document.fonts.load(`normal ${weight} 16px "${fontFamily}"`);
  }, [fontFamily, weight, id]);

  return null;
}
