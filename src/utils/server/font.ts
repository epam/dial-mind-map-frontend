import * as fontkit from 'fontkit';
import { Font } from 'fontkit';
import path from 'path';

import { AllowedFontsExtensions } from '@/constants/app';

export async function extractFontFamilyFromBuffer(
  buffer: Buffer,
  originalFilename: string,
): Promise<string | undefined> {
  const ext = path.extname(originalFilename).toLowerCase();

  if (!AllowedFontsExtensions.includes(ext)) {
    throw new Error(`Unsupported font format: ${ext}`);
  }

  try {
    const font = fontkit.create(buffer) as Font;
    return font.familyName || font.fullName || undefined;
  } catch (err) {
    throw new Error('Failed to parse font file: ' + (err as Error).message);
  }
}
