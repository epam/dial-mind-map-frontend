import { Core } from 'cytoscape';

import { ClusteredLayoutConfig } from '../types/config';
import { Pos } from '../types/shared';

/** Container pixel box and center. */
export function getContainer(cy: Core) {
  const { width, height } = cy.container()!.getBoundingClientRect();
  const center = { x: width / 2, y: height / 2 };
  return { width, height, center };
}

/** Main box function:
 * - For neon nodes → calculate clean size (no background).
 * - For all other nodes → keep default boundingBox logic.
 */
export function box(cy: Core, id: string, includeLabels: boolean, pad: number) {
  const node = cy.getElementById(id);
  if (!node || node.empty()) return { w: 2 * pad, h: 2 * pad };

  if (node.data('neon') === true) {
    const b = node.boundingBox({ includeLabels });
    const proportionWidth = node.data('neonSvgSize')?.rectWidth / (b?.w ?? 1) || 1;
    const proportionHeight = node.data('neonSvgSize')?.rectHeight / (b?.h ?? 1) || 1;

    const isIcon = node.data('icon') ?? false;
    const xPadding = isIcon ? (16 + 10) / proportionWidth : 16 / proportionWidth;
    const yPadding = 16 / proportionHeight;

    return { w: (b?.w ?? 0) - xPadding + 2 * pad, h: (b?.h ?? 0) - yPadding + 2 * pad };
  }

  // Non-neon nodes: use original boundingBox logic
  const b = node.boundingBox({ includeLabels });

  return { w: (b?.w ?? 0) + 2 * pad, h: (b?.h ?? 0) + 2 * pad };
}

export const nodeSize = (cy: Core, id: string, cfg: ClusteredLayoutConfig) => box(cy, id, false, cfg.LABEL_PAD);
export const nodeSizeWithLabels = (cy: Core, id: string) => box(cy, id, true, 0);

/** Compute axis-aligned bbox (TL) for ids given center positions and sizeFn. */
export function computeBBox(
  cy: Core,
  ids: string[],
  positions: Record<string, Pos>,
  sizeFn: (cy: Core, id: string, cfg: ClusteredLayoutConfig) => { w: number; h: number },
  cfg: ClusteredLayoutConfig,
) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const id of ids) {
    const p = positions[id];
    const s = sizeFn(cy, id, cfg);
    const x1 = p.x - s.w / 2;
    const y1 = p.y - s.h / 2;
    const x2 = p.x + s.w / 2;
    const y2 = p.y + s.h / 2;
    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

export function nodeRectAt(
  cy: Core,
  id: string,
  pos: Pos,
  cfg: ClusteredLayoutConfig,
  opts: { includeLabels?: boolean; pad?: number } = {},
) {
  const includeLabels = opts.includeLabels ?? true;
  const pad = opts.pad ?? 0;
  const size = includeLabels ? nodeSizeWithLabels(cy, id) : nodeSize(cy, id, cfg);
  const w = size.w + 2 * pad;
  const h = size.h + 2 * pad;
  return { x: pos.x - w / 2, y: pos.y - h / 2, w, h };
}
