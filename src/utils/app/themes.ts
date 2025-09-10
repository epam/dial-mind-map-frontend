import { isAbsoluteUrl } from './file';

export const getThemeIconUrl = (iconUrl: string) =>
  isAbsoluteUrl(iconUrl) ? iconUrl : `api/themes/image/${encodeURIComponent(iconUrl)}`;

export const getAppearanceFileUrl = (appName: string, theme: string, fileName: string, appFolder: string) => {
  let url = `/api/mindmaps/${encodeURIComponent(appName)}/appearances/themes/${theme}/storage/${encodeURIComponent(fileName)}`;

  if (appFolder) {
    url += `?folder=${appFolder}`;
  }

  return url;
};
