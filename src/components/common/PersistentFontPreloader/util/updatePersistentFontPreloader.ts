import { PERSISTENT_FONT_PRELOADER_ELEMENT_ID } from '@/constants/app';

/**
 * Updates the persistent preloader span to load a new font-family.
 *
 * @param fontFamily - The new font family to apply.
 * @param options - Optional weight and ID.
 */
export function updatePersistentFontPreloader(
  fontFamily: string,
  options?: {
    weight?: number;
    id?: string;
  },
) {
  const { weight = 400, id = PERSISTENT_FONT_PRELOADER_ELEMENT_ID } = options || {};
  const dummy = document.getElementById(id);

  if (!dummy) {
    console.warn(`[FontPreloader] No dummy element found with id "${id}"`);
    return;
  }

  dummy.style.fontFamily = `"${fontFamily}"`;
  dummy.style.fontWeight = `${weight}`;
  dummy.textContent = 'Preloading font';
  document.fonts.load(`normal ${weight} 16px "${fontFamily}"`);
}
