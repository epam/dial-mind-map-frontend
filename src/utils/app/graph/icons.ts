import { MindmapIconsFolderName } from '@/constants/app';

export const getColorizedIconPath = (rawPath: string, color: string, mindmapFolder: string) => {
  let path = undefined;
  if (!rawPath) {
    return path;
  }
  const [onlyPath, params] = rawPath.split('?');

  if (rawPath.startsWith(`${MindmapIconsFolderName}/`)) {
    const encoded = onlyPath.replace(/[^/]+$/, encodeURIComponent);

    path = `/api/${mindmapFolder}/${encoded}`;
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
