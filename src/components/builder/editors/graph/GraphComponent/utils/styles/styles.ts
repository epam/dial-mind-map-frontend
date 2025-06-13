import { Core, NodeSingular } from 'cytoscape';

export function extractNumberFromString(value: string): number {
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : NaN;
}

const cachedSizes = new Map<string, { width: number; height: number }>();
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

function initializeCanvas() {
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
}

function measureText(node: any, fontSize?: number): { width: number; height: number } {
  if (typeof window === 'undefined') {
    console.warn('measureText is being called on the server side. Returning 0.');
    return { width: 0, height: 0 };
  }

  const label = node.data('label');
  if (!label) {
    return { width: 0, height: 0 };
  }

  if (cachedSizes.has(label)) {
    return cachedSizes.get(label)!;
  }

  if (!canvas || !ctx) {
    initializeCanvas();
  }

  const fStyle = node.pstyle('font-style').strValue;
  const size = fontSize ?? node.pstyle('font-size').pfValue;
  const family = node.pstyle('font-family').strValue;
  const weight = node.pstyle('font-weight').strValue;
  ctx!.font = `${fStyle} ${weight} ${size}px ${family}`;

  const text = node.pstyle('label').strValue;
  const maxWidth = parseInt(node.pstyle('text-max-width').strValue);
  const lineHeight = node.pstyle('line-height').pfValue || 1; // Default to 1 if not set
  const wrappedLines: string[] = [];

  if (isNaN(maxWidth) || maxWidth <= 0) {
    const width = Math.ceil(ctx!.measureText(text).width);
    const height = size * lineHeight; // Height for a single line
    cachedSizes.set(label, { width, height });
    return { width, height };
  }

  for (const line of text.split('\n')) {
    let currentLine = '';
    const words = line.match(/[\S\u200b]+|\s+/g) || [];

    for (const word of words) {
      const testLine = currentLine ? `${currentLine}${word}` : word;
      if (Math.ceil(ctx!.measureText(testLine).width) >= maxWidth && currentLine) {
        wrappedLines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.trim()) {
      wrappedLines.push(currentLine.trim());
    }
  }

  const width = Math.ceil(Math.max(...wrappedLines.map(line => ctx!.measureText(line).width)));
  const height = wrappedLines.length * size * lineHeight; // Adjusted height using line-height

  cachedSizes.set(label, { width, height });

  return { width, height };
}

export function getWidth(node: any, fontSize?: number): number {
  return measureText(node, fontSize).width;
}

export function getHeight(node: any, fontSize?: number): number {
  return measureText(node, fontSize).height;
}

export function adjustFocusAndRootElementsStyles(
  cy: Core,
  focusNodeId: string,
  focusEdgeId: string,
  rootNodeId: string,
): void {
  cy.nodes().unselect();
  cy.getElementById(focusNodeId)?.select();
  cy.edges().unselect();
  cy.getElementById(focusEdgeId)?.select();

  if (rootNodeId) {
    cy.nodes().removeClass('root');
    cy.getElementById(rootNodeId)?.addClass('root');
  }
}

const darkenedColorsCache = new Map<string, string>();
type ColorType = 'background-color' | 'border-color' | 'color';

export const getDarkenedNodeColor = (node: NodeSingular, colorType: ColorType, percentage: number): string => {
  const cacheKey = `${node.id()}-${colorType}-${percentage}`;

  if (darkenedColorsCache.has(cacheKey)) {
    return darkenedColorsCache.get(cacheKey)!;
  }

  const originalColor = node.style(colorType);
  const darkenedColor = darkenRGBColor(originalColor, percentage);
  darkenedColorsCache.set(cacheKey, darkenedColor);

  return darkenedColor;
};

const darkenRGBColor = (rgbString: string, percentage = 10) => {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

  if (!match) return rgbString;

  let [, r, g, b] = match.map(Number);

  r = Math.max(0, Math.round(r - (r * percentage) / 100));
  g = Math.max(0, Math.round(g - (g * percentage) / 100));
  b = Math.max(0, Math.round(b - (b * percentage) / 100));

  return `rgb(${r}, ${g}, ${b})`;
};
