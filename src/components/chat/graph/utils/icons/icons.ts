import { renderToString } from 'react-dom/server';

import { AI_ROBOT_ICON_NAME } from '@/constants/app';

import { ArrowBackIcon } from '../../icons/ArrowBackIcon';
import { RobotIcon } from '../../icons/RobotIcon';
import { svgToBase64 } from './svgToBase64';

export const IconsMap: Record<string, React.FC<{ color: string }>> = {
  'arrow-back': ArrowBackIcon,
  [AI_ROBOT_ICON_NAME]: RobotIcon,
};

const getSvg = (iconName: string, color: string) => {
  const Icon = IconsMap[iconName];
  if (!Icon) {
    return 'none';
  }

  return svgToBase64(renderToString(Icon({ color })));
};

const IconsCache = new Map();

export const getIcon = (iconName: string, color: string) => {
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
