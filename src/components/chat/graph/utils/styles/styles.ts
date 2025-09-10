import { NodeSingular } from 'cytoscape';

import { DefaultVisitedNodeBgImageOpacity } from '@/constants/app';
import { PaletteSettings } from '@/types/customization';
import { SystemNodeDataKeys } from '@/types/graph';

export function extractNumberFromString(value: string): number {
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : NaN;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

function initializeCanvas() {
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
}

export function getWidth(node: any, fontSize?: number) {
  if (typeof window === 'undefined') {
    console.warn('measureText is being called on the server side. Returning 0.');
    return 0;
  }

  if (!canvas || !ctx) {
    initializeCanvas();
  }

  const fStyle = node.pstyle('font-style').strValue;
  const size = (fontSize ?? node.pstyle('font-size').pfValue) + 'px';
  const family = node.style('font-family');
  const weight = node.pstyle('font-weight').strValue;
  ctx!.font = `${fStyle} ${weight} ${size} ${family}`;

  return ctx!.measureText(node.data('label')).width;
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
              if (node.data(SystemNodeDataKeys.Pulsating)) {
                startPulsate(node);
              }
            },
          },
        );
      },
    },
  );
}

export const getSingleImageBgOpacity = (node: NodeSingular, palette?: PaletteSettings) => {
  const index = node.data(SystemNodeDataKeys.BranchColorIndex);
  const currentColors = palette?.branchesColors?.[index];
  const hasCustomVisitedColor = !currentColors || !!currentColors.visitedTextColor;
  return hasCustomVisitedColor ? 1 : DefaultVisitedNodeBgImageOpacity;
};
