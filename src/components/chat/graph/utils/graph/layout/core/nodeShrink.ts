import { Core } from 'cytoscape';

import { ClusteredLayoutConfig } from '../types/config';
import { Gaps, Item, Pos, RectTL } from '../types/shared';
import { computeBBox, nodeSizeWithLabels } from '../utils/cytoscape';
import { intersects } from '../utils/geometry';

export function computeNodeLevelShrinkScale(params: {
  cy: Core;
  levelOne: string[];
  clustersLocal: Record<
    string,
    {
      localPos: Record<string, { x: number; y: number }>;
      innerBBox: { w: number; h: number; cx: number; cy: number };
      outerRect: { w: number; h: number };
    }
  >;
  packedPositions: Record<string, { x: number; y: number }>;
  rootSizes: { packW: number; packH: number };
  gaps: Gaps;
  center: { x: number; y: number };
  width: number;
  height: number;
  cfg: ClusteredLayoutConfig;
}): number {
  const { cy, levelOne, clustersLocal, packedPositions, rootSizes, gaps, center, width, height, cfg } = params;

  // Helpers
  const inflateTL = (r: RectTL, pad: number): RectTL => ({
    x: r.x - pad / 2,
    y: r.y - pad / 2,
    w: r.w + pad,
    h: r.h + pad,
  });

  // root moat (same as in elliptic layout)
  const moat = Math.max(gaps.betweenClusters, 0);
  const rootVoidW = rootSizes.packW + moat + 2 * cfg.ROOT_PAD;
  const rootVoidH = rootSizes.packH + moat + 2 * cfg.ROOT_PAD;
  const rootVoidTL: RectTL = { x: center.x - rootVoidW / 2, y: center.y - rootVoidH / 2, w: rootVoidW, h: rootVoidH };

  // precompute local pack rects (with labels)
  const packs = levelOne.map(pid => {
    const local = clustersLocal[pid];
    const ids = Object.keys(local.localPos);
    const packLocal = computeBBox(cy, ids, local.localPos, nodeSizeWithLabels, cfg);
    const packLocalTL: RectTL = { x: packLocal.x, y: packLocal.y, w: packLocal.w, h: packLocal.h };
    return { pid, local, packLocalTL };
  });

  const clusterPad = Math.max(moat, cfg.CLUSTER_PAD);
  const respectContainer = false;

  const buildWorld = (s: number) =>
    packs.map(rec => {
      const pc = packedPositions[rec.pid];
      const cx = center.x + (pc.x - center.x) * s;
      const cy = center.y + (pc.y - center.y) * s;
      const shiftX = cx - rec.local.innerBBox.cx;
      const shiftY = cy - rec.local.innerBBox.cy;
      const packTL: RectTL = {
        x: rec.packLocalTL.x + shiftX,
        y: rec.packLocalTL.y + shiftY,
        w: rec.packLocalTL.w,
        h: rec.packLocalTL.h,
      };
      return { id: rec.pid, packTL };
    });

  const hasCollision = (s: number) => {
    const world = buildWorld(s);

    // pack vs pack (inflated)
    for (let i = 0; i < world.length; i++) {
      const Ai = inflateTL(world[i].packTL, clusterPad);
      if (intersects(Ai, rootVoidTL)) {
        return true;
      }
      for (let j = i + 1; j < world.length; j++) {
        const Bj = inflateTL(world[j].packTL, clusterPad);
        if (intersects(Ai, Bj)) {
          return true;
        }
      }
    }

    if (respectContainer) {
      const out = (r: RectTL) =>
        r.x < gaps.border || r.y < gaps.border || r.x + r.w > width - gaps.border || r.y + r.h > height - gaps.border;
      for (const W of world) if (out(inflateTL(W.packTL, clusterPad))) return true;
    }
    return false;
  };

  // Binary search for largest safe shrink
  const maxIters = 40;
  const tol = 1e-4;
  const minScale = 1e-3;
  let lo = minScale;
  let hi = 1;
  if (hasCollision(hi)) {
    for (let k = 0; k < 8 && hasCollision(hi); k++) {
      hi *= 1.1;
    }
  }
  for (let it = 0; it < maxIters && hi - lo > tol; it++) {
    const mid = 0.5 * (lo + hi);
    if (hasCollision(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Math.min(1, Math.max(minScale, hi));
}

function rectsOverlap(a: RectTL, b: RectTL) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

/**
 * Uniformly scales all points along rays from `center` by factor s ∈ (0, +∞),
 * preserving angles. Finds:
 *  - if allowExpand=true and initial layout collides → the SMALLEST s ≥ 1 that avoids collisions
 *  - otherwise → the LARGEST s ≤ 1 that avoids collisions (i.e., compact as much as possible)
 *
 * Collisions are checked pairwise between children and (optionally) against `parentRect`.
 */
export function shrinkAlongRaysToAvoidCollisions(params: {
  items: Item[];
  center: { x: number; y: number };
  parentRect?: RectTL; // inflated parent rect to avoid touching the root
  maxIters?: number; // binary search iterations
  eps?: number; // tolerance
  allowExpand?: boolean; // try to expand if initial layout collides
}): { scale: number; positions: Record<string, Pos> } {
  const { items, center, parentRect, maxIters = 40, eps = 1e-4, allowExpand = true } = params;

  const scaledPositions = (s: number): Record<string, Pos> => {
    const out: Record<string, Pos> = {};
    for (const it of items) {
      const dx = it.x - center.x;
      const dy = it.y - center.y;
      out[it.id] = { x: center.x + s * dx, y: center.y + s * dy };
    }
    return out;
  };

  const hasCollision = (pos: Record<string, Pos>) => {
    const rects = items.map(it => {
      const p = pos[it.id];
      return { id: it.id, r: { x: p.x - it.w / 2, y: p.y - it.h / 2, w: it.w, h: it.h } as RectTL };
    });

    // vs parent
    if (parentRect) {
      for (const a of rects) {
        if (rectsOverlap(a.r, parentRect)) {
          return true;
        }
      }
    }
    // pairwise
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(rects[i].r, rects[j].r)) return true;
      }
    }
    return false;
  };

  // initial
  let bestScale = 1;
  let bestPos = scaledPositions(1);
  const initialCollides = hasCollision(bestPos);

  // If initial collides, optionally expand outwards to find a safe >=1, then binary-search down.
  if (initialCollides && allowExpand) {
    let hi = 1;
    // grow multiplicatively until safe or up to a sane limit
    while (hasCollision(scaledPositions(hi)) && hi < 16) hi *= 1.6;

    // binary search for the smallest safe scale in [1, hi]
    let L = 1,
      H = hi;
    for (let it = 0; it < maxIters && H - L > eps; it++) {
      const mid = (L + H) / 2;
      const pos = scaledPositions(mid);
      if (hasCollision(pos)) L = mid;
      else {
        H = mid;
        bestScale = H;
        bestPos = pos;
      }
    }
    return { scale: bestScale, positions: bestPos };
  }

  // Normal shrink: search for the largest safe ≤1
  let lo = 0,
    hi = 1;
  if (!initialCollides) {
    bestScale = 1;
    bestPos = scaledPositions(1);
  }
  for (let it = 0; it < maxIters && hi - lo > eps; it++) {
    const mid = (lo + hi) / 2;
    const pos = scaledPositions(mid);
    if (hasCollision(pos)) lo = mid;
    else {
      hi = mid;
      bestScale = hi;
      bestPos = pos;
    }
  }
  return { scale: bestScale, positions: bestPos };
}
