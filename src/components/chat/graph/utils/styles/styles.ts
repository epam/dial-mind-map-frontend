import { NodeSingular } from 'cytoscape';

export function extractNumberFromString(value: string): number {
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : NaN;
}

export function getWidth(node: any, fontSize?: number) {
  const ctx = document.createElement('canvas').getContext('2d')!;
  const fStyle = node.pstyle('font-style').strValue;
  const size = (fontSize ?? node.pstyle('font-size').pfValue) + 'px';
  const family = node.pstyle('font-family').strValue;
  const weight = node.pstyle('font-weight').strValue;
  ctx.font = `${fStyle} ${weight} ${size} ${family}`;

  return ctx.measureText(node.data('label')).width;
}

export function getHeight(node: any, fontSize?: number) {
  return fontSize ?? node.pstyle('font-size').pfValue;
}

export const lightenRGBColor = (rgbString: string, percentage = 10) => {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

  if (!match) return rgbString;

  let [, r, g, b] = match.map(Number);

  r = Math.min(255, Math.round(r + (r * percentage) / 100));
  g = Math.min(255, Math.round(g + (g * percentage) / 100));
  b = Math.min(255, Math.round(b + (b * percentage) / 100));

  return `rgb(${r}, ${g}, ${b})`;
};

export function startPulsate(node: NodeSingular) {
  const hasIcon = node.data('icon') ?? false;
  const up = hasIcon ? [1, 1] : 1;
  const down = hasIcon ? [0.7, 0.3] : 0.3;
  node.animate(
    {
      style: {
        'background-image-opacity': up,
      },
    },
    {
      duration: 900,
      queue: false,
      complete: () => {
        node.animate(
          {
            style: {
              'background-image-opacity': down,
            },
          },
          {
            duration: 900,
            queue: false,
            complete: () => {
              if (node.data('pulsating')) {
                startPulsate(node);
              }
            },
          },
        );
      },
    },
  );
}
