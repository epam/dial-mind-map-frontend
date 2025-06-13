import cssEscape from 'css.escape';
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { errorsMessages } from '@/constants/errors';
import { inconsolata, inter } from '@/fonts/fonts';
import { HTTPMethod } from '@/types/http';
import { ThemesConfig } from '@/types/themes';
import { isAbsoluteUrl } from '@/utils/app/file';
import { getThemeIconUrl } from '@/utils/app/themes';
import { logger } from '@/utils/server/logger';

let cachedTheme = '';
let cachedThemeExpiration: number | undefined;

function generateColorsCssVariables(variables: Record<string, string> | undefined) {
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

function generateUrlsCssVariables(variables: Record<string, string> | undefined) {
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

function generateFontCssVariables(variables: Record<string, string | undefined> | undefined) {
  if (!variables) {
    return `${inter.variable}:${inter.style.fontFamily};\n`;
  }

  let cssContent = '';
  Object.entries(variables).forEach(([variable, value]) => {
    let compiledValue = value;
    if (!value || !value.length) {
      compiledValue = inter.style.fontFamily;
    }

    cssContent += `--${cssEscape(variable)}: ${compiledValue};\n`;
  });
  return cssContent;
}

function wrapCssContents(wrapper: string, contents: string[]): string {
  return `${wrapper} {\n ${contents.join('')}\n }\n`;
}

async function handler() {
  if (!process.env.THEMES_CONFIG_HOST) {
    return new NextResponse(errorsMessages.customThemesConfigNotProvided, { status: 500 });
  }

  if (cachedThemeExpiration && cachedTheme && cachedThemeExpiration > Date.now()) {
    return new NextResponse(cachedTheme, {
      status: 200,
      headers: { 'Content-Type': 'text/css' },
    });
  }

  const controller = new AbortController();
  const response = await fetch(`${process.env.THEMES_CONFIG_HOST}/config.json`, {
    method: HTTPMethod.GET,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  });

  if (!response.ok) {
    logger.error(
      `Received error when fetching config file: ${response.status} ${response.statusText} ${await response.text()}`,
    );
    if (response.status === 401) {
      return new NextResponse(errorsMessages.unauthorized, { status: 401 });
    }
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }

  const json = (await response.json()) as ThemesConfig;

  const dayInMs = 86400000;

  try {
    cachedTheme = [
      ...json.themes.map(theme =>
        wrapCssContents(`.${theme.id}`, [
          generateColorsCssVariables(theme.colors),
          generateUrlsCssVariables({ 'app-logo': theme['app-logo'] }),
          generateFontCssVariables({
            'theme-font': theme['font-family'],
            'codeblock-font': theme['font-codeblock'] ?? inconsolata.style.fontFamily,
          }),
        ]),
      ),
      generateUrlsCssVariables({ ...json.images }),
    ].join('\n');
    cachedThemeExpiration = Date.now() + dayInMs;

    return new NextResponse(cachedTheme, {
      status: 200,
      headers: { 'Content-Type': 'text/css' },
    });
  } catch (e: unknown) {
    logger.error(`Error happened during parsing theme file: ${(e as Error).message}`);
    return new NextResponse(errorsMessages.generalServer, { status: 500 });
  }
}

export { handler as GET };
