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
  const maxWidth = node.pstyle('text-max-width').pfValue;
  const lineHeight = node.pstyle('line-height').pfValue || 1;
  const textWrap = node.pstyle('text-wrap').value;
  const overflow = node.pstyle('text-overflow-wrap').value;

  // If there's no maxWidth or wrapping isn't enabled -> single-line measurement
  if (!maxWidth || isNaN(maxWidth) || maxWidth <= 0 || textWrap !== 'wrap') {
    const metrics = ctx!.measureText(text);
    const width = Math.ceil(metrics.width);
    const labelDimsHeight = size;
    const height = labelDimsHeight;
    cachedSizes.set(label, { width, height });
    return { width, height };
  }

  const zwsp = '\u200b';
  const lines = text.split('\n');
  const overflowAny = overflow === 'anywhere';
  const wrappedLines: string[] = [];

  // Cytoscape separator logic:
  const separatorRegex = /[\s\u200b]+|$/g;

  for (let l = 0; l < lines.length; l++) {
    let line = lines[l];

    // If overflow-anywhere -> insert zwsp between chars so matchAll splits into individual "words"
    if (overflowAny) {
      line = line.split('').join(zwsp);
    }

    // If the whole line fits, just push as-is
    const metricsLine = ctx!.measureText(line);
    const lineW = Math.ceil(metricsLine.width);

    if (lineW <= maxWidth) {
      wrappedLines.push(line);
      continue;
    }

    // otherwise we must split according to separators (mimic Cytoscape's matchAll flow)
    let subLine = '';
    let previousIndex = 0;
    const separatorMatches = line.matchAll(separatorRegex);

    for (const separatorMatch of separatorMatches) {
      const wordSeparator = separatorMatch[0]; // includes whitespace or zwsp OR "" at end
      const matchIndex = separatorMatch.index ?? line.length;
      const word = line.substring(previousIndex, matchIndex);
      previousIndex = matchIndex + wordSeparator.length;

      const testLine = subLine.length === 0 ? word : subLine + word + wordSeparator;
      const testW = Math.ceil(ctx!.measureText(testLine).width);

      if (testW <= maxWidth) {
        // fits on current line
        // append word + separator when not first
        if (subLine.length === 0) {
          subLine = word + wordSeparator;
        } else {
          subLine = subLine + word + wordSeparator;
        }
      } else {
        // word would overflow current line
        if (subLine) {
          // push the sub-line exactly as cytoscape does (it keeps separators)
          wrappedLines.push(subLine);
        }
        // start new sub-line with word + separator
        subLine = word + wordSeparator;
      }
    }

    if (subLine && !subLine.match(/^[\s\u200b]+$/)) {
      wrappedLines.push(subLine);
    }
  }

  let width = 0;
  let labelDimsHeight = 0;
  for (let i = 0; i < wrappedLines.length; i++) {
    const w = Math.ceil(ctx!.measureText(wrappedLines[i]).width);
    width = Math.max(width, w);
    labelDimsHeight += size;
  }

  const numLines = Math.max(wrappedLines.length, 1);
  const finalHeight = labelDimsHeight + (numLines - 1) * (lineHeight - 1) * (labelDimsHeight / numLines);

  cachedSizes.set(label, { width, height: finalHeight });

  return { width, height: finalHeight };
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
