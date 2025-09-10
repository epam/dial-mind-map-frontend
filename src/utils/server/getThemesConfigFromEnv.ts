import { defaultConfig } from '@/constants/appearances/defaultConfig';
import { ThemeConfig } from '@/types/customization';

import { logger } from './logger';

export function getThemesConfigFromEnv(): Record<string, ThemeConfig> {
  const themes = process.env.THEMES_CONFIG;
  if (!themes) return defaultConfig;

  try {
    return JSON.parse(themes) as Record<string, ThemeConfig>;
  } catch (error) {
    logger.error({ error }, 'Failed to parse THEMES_CONFIG, fallback to defaultConfig');
    return defaultConfig;
  }
}
