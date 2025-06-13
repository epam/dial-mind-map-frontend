import { renderToString } from 'react-dom/server';

import { ArrowBackIcon } from '../../icons/ArrowBackIcon';
import { svgToBase64 } from './svgToBase64';

export const IconsMap: Record<string, React.FC<{ color: string }>> = {
  'arrow-back': ArrowBackIcon,
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
