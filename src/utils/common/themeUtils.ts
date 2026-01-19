import cssEscape from 'css.escape';

import { inconsolata, inter } from '@/fonts/fonts';
import type { ThemeConfig } from '@/types/customization';
import { ThemesConfigs } from '@/types/themes';

import { isAbsoluteUrl } from '../app/file';
import { getThemeIconUrl } from '../app/themes';

const DEFAULT_FONT_VAR_NAME = '--font-family';
const DEFAULT_FONT_FAMILY =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'";

export function generateColorsCssVariables(variables?: Record<string, string>) {
  if (!variables) return '';
  let cssContent = '';
  for (const [variable, value] of Object.entries(variables)) {
    const compiledValue = value?.startsWith('#') ? value : '';
    cssContent += `--${cssEscape(variable)}: ${compiledValue};\n`;
  }
  return cssContent;
}

export function wrapCssContents(wrapper: string, contents: string[]): string {
  return `${wrapper} {\n ${contents.join('')}\n }\n`;
}

export function generateFontCssVariables(
  variables?: Record<string, string | undefined>,
  fallbackVarName: string = DEFAULT_FONT_VAR_NAME,
  fallbackFamily: string = DEFAULT_FONT_FAMILY,
) {
  if (!variables) {
    return `${fallbackVarName}: ${fallbackFamily};\n`;
  }
  let cssContent = '';
  for (const [variable, value] of Object.entries(variables)) {
    const compiledValue = value && value.length ? value : fallbackFamily;
    cssContent += `--${cssEscape(variable)}: ${compiledValue};\n`;
  }
  return cssContent;
}

export function generateUrlsCssVariables(variables: Record<string, string> | undefined) {
  if (!variables) {
    return '';
  }

  let cssContent = '';
  Object.entries(variables).forEach(([variable, value]) => {
    if (!value) {
      return;
    }
    let compiledValue = value;
    if (!isAbsoluteUrl(value)) {
      compiledValue = getThemeIconUrl(value);
    }
    cssContent += `--${cssEscape(variable)}: url('${compiledValue}');\n`;
  });
  return cssContent;
}

const generateReferencesCssVariables = (references: ThemeConfig['references']) => {
  if (!references?.badge) return '';
  let cssContent = '';
  Object.entries(references.badge).forEach(([variable, value]) => {
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([subVariable, subValue]) => {
        cssContent += `--references-badge-${cssEscape(variable)}-${cssEscape(subVariable)}: ${subValue};\n`;
      });
    }
  });
  return cssContent;
};

export const mapThemeConfigToStyles = (
  theme: string,
  config: ThemeConfig | null,
  opts?: { defaultFontVarName?: string; defaultFontFamily?: string },
) => {
  const defaultVar = opts?.defaultFontVarName ?? DEFAULT_FONT_VAR_NAME;
  const defaultFamily = opts?.defaultFontFamily ?? DEFAULT_FONT_FAMILY;

  const parts: string[] = [generateColorsCssVariables(config?.colors)];

  if (config?.references) {
    parts.push(generateReferencesCssVariables(config.references));
  }

  if (config?.font?.['font-family']) {
    parts.push(generateFontCssVariables({ 'theme-font': config.font['font-family'] }, defaultVar, defaultFamily));
  } else {
    parts.push(generateFontCssVariables(undefined, defaultVar, defaultFamily));
  }

  let fontFaceRules = '';
  let otherCustomStyles = '';

  if (config?.chat?.customStyles) {
    const processed = extractFontFaceRules(config.chat.customStyles);
    fontFaceRules = processed.fontFaces;
    otherCustomStyles = processed.otherStyles;
  }

  const wrappedStyles = wrapCssContents(`.${theme}`, [...parts, otherCustomStyles]);
  return `${fontFaceRules}\n${wrappedStyles}`;
};

/**
 * Extracts @font-face rules from a CSS string and separates them from other styles.
 * @param cssString The input CSS string.
 * @returns An object containing `fontFaces` (string of @font-face rules) and `otherStyles` (remaining styles).
 */
const extractFontFaceRules = (cssString: string): { fontFaces: string; otherStyles: string } => {
  if (!cssString) return { fontFaces: '', otherStyles: '' };

  const fontFaces: string[] = [];
  const otherChunks: string[] = [];

  let i = 0;
  while (i < cssString.length) {
    const at = cssString.indexOf('@font-face', i);
    if (at === -1) {
      otherChunks.push(cssString.slice(i));
      break;
    }
    if (at > i) otherChunks.push(cssString.slice(i, at));

    const braceStart = cssString.indexOf('{', at);
    if (braceStart === -1) {
      otherChunks.push(cssString.slice(at));
      break;
    }

    let depth = 1;
    let j = braceStart + 1;
    while (j < cssString.length && depth > 0) {
      const ch = cssString[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      j++;
    }

    if (depth === 0) {
      fontFaces.push(cssString.slice(at, j));
      i = j;
    } else {
      otherChunks.push(cssString.slice(at));
      break;
    }
  }

  return {
    fontFaces: fontFaces.join('\n'),
    otherStyles: otherChunks.join('').trim(),
  };
};

export const mapDialThemeConfigToStyles = (config: ThemesConfigs) => {
  return [
    ...config.themes.map(theme =>
      wrapCssContents(`.${theme.id}`, [
        generateColorsCssVariables(theme.colors),
        generateUrlsCssVariables({ 'app-logo': theme['app-logo'] }),
        generateFontCssVariables({
          'theme-font': theme['font-family'] ?? inter.style.fontFamily,
          'codeblock-font': theme['font-codeblock'] ?? inconsolata.style.fontFamily,
        }),
      ]),
    ),
    generateUrlsCssVariables({ ...config.images }),
  ].join('\n');
};
