import { NodeSingular } from 'cytoscape';
import { memoize } from 'lodash-es';

import { getHeight, getWidth } from './styles';

export const getNeonBackground = (node: NodeSingular) => {
  const color = node.data('bg-color');
  const isIcon = node.data('icon') ?? false;

  const baseWidth = isIcon ? getWidth(node) + 16 + 10 : getWidth(node) + 16;
  const baseHeight = getHeight(node) + 16;
  const rectWidth = baseWidth;
  const rectHeight = baseHeight;
  const svg = generateNeonSVG(color, rectWidth, rectHeight);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Converts a hex color code to an RGB string formatted for feColorMatrix.
 * @param hex - The hex color code (e.g., "#RRGGBB").
 * @returns A string representing the RGB values normalized to the range [0, 1], separated by spaces.
 * @throws Error if the input is not a valid hex color code.
 */
export const convertHexToNormalizedRgb = (hex: string): string => {
  // Validate the input format
  if (!/^#([0-9A-Fa-f]{6})$/.test(hex)) {
    throw new Error(`Invalid hex color code: "${hex}". Expected format: "#RRGGBB".`);
  }

  // Parse the hex color code
  const bigint = parseInt(hex.slice(1), 16);
  const r = ((bigint >> 16) & 255) / 255; // Extract and normalize the red component
  const g = ((bigint >> 8) & 255) / 255; // Extract and normalize the green component
  const b = (bigint & 255) / 255; // Extract and normalize the blue component

  // Return the normalized RGB values as a space-separated string
  return `${r} ${g} ${b}`;
};

export const generateNeonSVG = memoize(
  (color: string, rectWidth: number, rectHeight: number) => {
    if (!color) return '';
    const padding = 160;
    const svgWidth = rectWidth + padding * 2;
    const svgHeight = rectHeight + padding * 2;
    const filterX = -padding;
    const filterY = -padding;
    const filterWidth = svgWidth + padding * 2;
    const filterHeight = svgHeight + padding * 2;

    const [r, g, b] = convertHexToNormalizedRgb(color).split(' ');

    return `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <defs>
    <filter id="neon-glow" filterUnits="userSpaceOnUse" x="${filterX}" y="${filterY}" width="${filterWidth}" height="${filterHeight}" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="2" result="blur1"/>
      <feColorMatrix in="blur1" type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 1.2 0" result="color1"/>

      <feGaussianBlur stdDeviation="7" result="blur2"/>
      <feColorMatrix in="blur2" type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 1.0 0" result="color2"/>

      <feGaussianBlur stdDeviation="11" result="blur3"/>
      <feColorMatrix in="blur3" type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 0.9 0" result="color3"/>

      <feGaussianBlur stdDeviation="15" result="blur4"/>
      <feColorMatrix in="blur4" type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 0.7 0" result="color4"/>

      <feMerge>
        <feMergeNode in="color1"/>
        <feMergeNode in="color2"/>
        <feMergeNode in="color3"/>
        <feMergeNode in="color4"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect x="${padding}" y="${padding}" width="${rectWidth}" height="${rectHeight}" rx="8" ry="8" fill="${color}" filter="url(#neon-glow)"/>
</svg>
`;
  },
  (...args) => args.join('-'),
);
