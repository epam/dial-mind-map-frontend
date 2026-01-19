import { renderToString } from 'react-dom/server';

import { AI_ROBOT_ICON_NAME, ARROW_BACK_ICON_NAME } from '@/constants/app';
import { getColorizedStorageIconPath } from '@/utils/app/graph/icons';

import { ArrowBackIcon } from '../../icons/ArrowBackIcon';
import { RobotIcon } from '../../icons/RobotIcon';
import { svgToBase64 } from './svgToBase64';

export const IconsMap: Record<string, React.FC<{ color: string }>> = {
  [ARROW_BACK_ICON_NAME]: ArrowBackIcon,
  [AI_ROBOT_ICON_NAME]: RobotIcon,
};

const getSvg = (iconName: string, color: string) => {
  const Icon = IconsMap[iconName];
  if (!Icon) {
    return 'none';
  }

  return svgToBase64(renderToString(<Icon color={color} />));
};

const IconsCache = new Map();

export const getIcon = (iconName: string, color: string): string => {
  if (!iconName) {
    return 'none';
  }

  const key = `${iconName}-${color}`;

  if (IconsCache.has(key)) {
    return IconsCache.get(key);
  }

  const svg = getSvg(iconName, color);
  IconsCache.set(key, svg);

  return svg;
};

export const isSystemImg = (img: string) => !!IconsMap[img];

export const getSystemImage = ({
  img,
  customImg,
  color,
  mindmapAppName,
  theme,
}: {
  img: string;
  customImg?: string;
  color: string;
  mindmapAppName: string;
  theme: string;
}) => {
  if (!isSystemImg(img)) return undefined;

  if (customImg) {
    return getColorizedStorageIconPath(customImg, color, mindmapAppName, theme);
  }

  return getIcon(img, color);
};
