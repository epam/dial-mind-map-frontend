import { MindmapIconsFolderName } from '@/constants/app';

import { getAppearanceFileUrl } from '../themes';

export const getColorizedIconPath = (rawPath: string, color: string, mindmapFolder: string) => {
  let path = undefined;
  if (!rawPath) {
    return path;
  }
  const [onlyPath, params] = rawPath.split('?');

  if (rawPath.startsWith(`${MindmapIconsFolderName}/`)) {
    const encoded = onlyPath.replace(/[^/]+$/, encodeURIComponent);

    path = `/api/${mindmapFolder}${encoded}`;
  }

  const isSvg = !!path?.endsWith('.svg');
  if (path && isSvg) {
    path += `?currentColor=${encodeURIComponent(color)}`;
  }
  if (params) {
    const separator = isSvg ? '&' : '?';
    path += `${separator}${params}`;
  }

  return path ?? 'none';
};

export const getColorizedStorageIconPath = (
  iconName: string,
  color: string,
  appName: string,
  theme: string,
  appFolder: string,
) => {
  let path = undefined;
  if (!iconName) {
    return path;
  }

  path = getAppearanceFileUrl(appName, theme, iconName, appFolder);

  if (iconName.endsWith('.svg')) {
    const param = `currentColor=${encodeURIComponent(color)}`;
    if (path.includes('?')) {
      path += `&${param}`;
    } else {
      path += `?${param}`;
    }
  }

  return path;
};
