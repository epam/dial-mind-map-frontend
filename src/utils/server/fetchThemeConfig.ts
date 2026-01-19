import { defaultConfig } from '@/constants/appearances/defaultConfig';
import { EtagHeaderName } from '@/constants/http';
import { Application } from '@/types/application';
import { ThemeConfig } from '@/types/customization';
import { HTTPMethod } from '@/types/http';
import { ThemesConfigs } from '@/types/themes';

import { getApiHeaders } from './get-headers';
import { getAuthParamsFromServer } from './getAuthParamsFromServer';
import { logger } from './logger';

export const fetchChatThemeConfig = async (
  theme: string,
  app?: Application,
): Promise<[ThemeConfig | null, string | null]> => {
  try {
    const name = app?.name ?? app?.application ?? '';
    if (!name) {
      logger.warn('fetchThemeConfig: missing application name');
      return [null, null];
    }

    const auth = await getAuthParamsFromServer();

    const url = `${process.env.DIAL_API_HOST}/v1/deployments/${name}/route/v1/appearances/themes/${encodeURIComponent(theme)}`;

    const headers = getApiHeaders({
      authParams: auth,
      contentType: 'application/json',
    });

    const res = await fetch(url, {
      method: HTTPMethod.GET,
      headers,
    });

    let themesConfig: Record<string, ThemeConfig> = defaultConfig;
    try {
      if (process.env.THEMES_CONFIG) {
        themesConfig = JSON.parse(process.env.THEMES_CONFIG) as Record<string, ThemeConfig>;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to parse THEMES_CONFIG, fallback to defaultConfig');
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      logger.warn(
        { status: res.status, statusText: res.statusText, url, body: errorText?.slice(0, 1000) },
        `Error fetching theme ${theme} for mindmap ${name}`,
      );

      if (res.status === 401) return [null, null];

      if (res.status === 404) {
        const fallback = themesConfig?.[theme];
        if (fallback) {
          const etag = res.headers.get(EtagHeaderName);
          return [fallback, etag];
        }
        logger.warn({ theme }, 'Theme not found in THEMES_CONFIG fallback');
        return [null, null];
      }

      return [null, null];
    }

    const etag = res.headers.get(EtagHeaderName);
    const json = (await res.json()) as ThemeConfig;

    const defaultTheme = themesConfig?.[theme];
    const merged: ThemeConfig = defaultTheme ? { ...defaultTheme, ...json } : json;

    return [merged, etag ?? null];
  } catch (error) {
    logger.error({ err: error }, 'fetchThemeConfig failed');
    return [null, null];
  }
};

export const fetchDialThemeConfig = async (): Promise<ThemesConfigs | null> => {
  try {
    const res = await fetch(`${process.env.THEMES_CONFIG_HOST}/config.json`, {
      method: HTTPMethod.GET,
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      logger.warn(
        { status: res.status, statusText: res.statusText, body: errorText?.slice(0, 1000) },
        `Error fetching the DIAL theme`,
      );

      return null;
    }

    const json = (await res.json()) as ThemesConfigs;

    return json;
  } catch (error) {
    logger.error({ err: error }, 'fetchThemeConfig failed');
    return null;
  }
};
