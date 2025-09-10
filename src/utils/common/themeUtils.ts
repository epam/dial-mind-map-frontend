import cssEscape from 'css.escape';
import postcss from 'postcss';

import { montserrat } from '@/fonts/fonts';
import { ThemeConfig } from '@/types/customization';

export function generateColorsCssVariables(variables: Record<string, string> | undefined) {
  if (!variables) {
    return '';
  }

  let cssContent = '';
  Object.entries(variables).forEach(([variable, value]) => {
    let compiledValue = value;

    if (!value.startsWith('#')) {
      compiledValue = '';
    }
    cssContent += `--${cssEscape(variable)}: ${compiledValue};\n`;
  });
  return cssContent;
}

export function wrapCssContents(wrapper: string, contents: string[]): string {
  return `${wrapper} {\n ${contents.join('')}\n }\n`;
}

export function generateFontCssVariables(variables: Record<string, string | undefined> | undefined) {
  if (!variables) {
    return `${montserrat.variable}:${montserrat.style.fontFamily};\n`;
  }

  let cssContent = '';
  Object.entries(variables).forEach(([variable, value]) => {
    let compiledValue = value;
    if (!value || !value.length) {
      compiledValue = montserrat.style.fontFamily;
    }

    cssContent += `--${cssEscape(variable)}: ${compiledValue};\n`;
  });
  return cssContent;
}

const generateReferencesCssVariables = (references: ThemeConfig['references']) => {
  if (!references) {
    return '';
  }

  let cssContent = '';
  Object.entries(references.badge).forEach(([variable, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subVariable, subValue]) => {
        cssContent += `--references-badge-${cssEscape(variable)}-${cssEscape(subVariable)}: ${subValue};\n`;
      });
    }
  });
  return cssContent;
};

export const themeConfigToStyles = (theme: string, config: ThemeConfig | null) => {
  const parts = [generateColorsCssVariables(config?.colors)];

  if (config?.references) {
    parts.push(generateReferencesCssVariables(config.references));
  }

  if (config?.font?.['font-family']) {
    parts.push(
      generateFontCssVariables({
        'theme-font': config.font['font-family'],
      }),
    );
  }

  let fontFaceRules = '';
  let otherCustomStyles = '';

  if (config?.chat?.customStyles) {
    const processedStyles = extractFontFaceRules(config.chat.customStyles);

    fontFaceRules = processedStyles.fontFaces;
    otherCustomStyles = processedStyles.otherStyles;
  }

  const wrappedStyles = wrapCssContents(`.${theme}`, [...parts, otherCustomStyles]);

  const styles = `${fontFaceRules}\n${wrappedStyles}`;

  return styles;
};

/**
 * Extracts @font-face rules from a CSS string and separates them from other styles.
 * @param cssString The input CSS string.
 * @returns An object containing `fontFaces` (string of @font-face rules) and `otherStyles` (remaining styles).
 */
const extractFontFaceRules = (cssString: string): { fontFaces: string; otherStyles: string } => {
  const root = postcss.parse(cssString);
  const fontFaceRules: string[] = [];
  const otherRules: string[] = [];

  root.nodes.forEach(node => {
    if (node.type === 'atrule' && node.name === 'font-face') {
      fontFaceRules.push(node.toString());
    } else {
      otherRules.push(node.toString());
    }
  });

  return {
    fontFaces: fontFaceRules.join('\n'),
    otherStyles: otherRules.join('\n'),
  };
};
