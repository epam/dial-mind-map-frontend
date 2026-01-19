import { Core } from 'cytoscape';

import { ClusteredLayoutConfig } from '../types/config';
import { Pos } from '../types/shared';
import { computeBBox, nodeSize, nodeSizeWithLabels } from '../utils/cytoscape';
import { polar, supportOnDir } from '../utils/geometry';
import { shrinkAlongRaysToAvoidCollisions } from './nodeShrink';

/** Span lookup by child count (compactness tuning). */
export function spanByCount(n: number, cfg: ClusteredLayoutConfig) {
  if (n <= 1) return cfg.SPAN_BY_COUNT.one;
  if (n === 2) return cfg.SPAN_BY_COUNT.two;
  if (n === 3) return cfg.SPAN_BY_COUNT.three;
  return cfg.SPAN_BY_COUNT.default;
}

/** Angular width needed for a child of given width on a ring of radius r. */
export function childAngleForWidth(width: number, gap: number, r: number, eps: number) {
  const denom = Math.max(2 * r, eps);
  const s = Math.min(Math.max((width + gap) / denom, 0), 1);
  return 2 * Math.asin(s);
}

const sumAngleForWidths = (ws: number[], gap: number, r: number, eps: number) =>
  ws.reduce((acc, w) => acc + childAngleForWidth(w, gap, r, eps), 0);

/** Find minimal arc radius that fits all children across a target span. */
export function fitArcRadiusForKids(
  cy: Core,
  parentId: string,
  childIds: string[],
  targetSpan: number,
  cfg: ClusteredLayoutConfig,
) {
  if (!childIds.length) return 0;
  const pH = nodeSize(cy, parentId, cfg).h / 2;
  const sizes = childIds.map(id => nodeSize(cy, id, cfg));
  const maxH = Math.max(...sizes.map(s => s.h));
  const widths = sizes.map(s => s.w);
  const minR = pH + cfg.CHILD_RING_PAD + maxH / 2 + cfg.GAP;

  let lo = Math.max(minR, cfg.EPS);
  let hi = lo * 2;
  for (let i = 0; i < 32 && sumAngleForWidths(widths, cfg.GAP, hi, cfg.EPS) > targetSpan; i++) hi *= 1.8;

  const fits = (r: number) => sumAngleForWidths(widths, cfg.GAP, r, cfg.EPS) <= targetSpan;
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi);
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Place children along a local arc centered at (0,0). */
export function placeKidsOnArcLocal(
  cy: Core,
  parentId: string,
  baseAngle: number,
  span: number,
  childIds: string[],
  cfg: ClusteredLayoutConfig,
  out: Record<string, Pos>,
) {
  if (!childIds.length) return;
  const r = fitArcRadiusForKids(cy, parentId, childIds, span, cfg);
  const widths = childIds.map(id => nodeSize(cy, id, cfg).w);
  const angles = widths.map(w => childAngleForWidth(w, cfg.GAP, r, cfg.EPS));
  let acc = -span / 2;
  for (let i = 0; i < childIds.length; i++) {
    const ang = baseAngle + (acc + angles[i] / 2);
    out[childIds[i]] = polar(0, 0, r, ang);
    acc += angles[i];
  }
}

/** Find minimal circle radius that fits children around parent without overlap. */
export function fitCircleRadiusForKids(
  cy: Core,
  parentId: string,
  childIds: string[],
  cfg: ClusteredLayoutConfig,
  wrapGap: number = cfg.RING_MIN_DEG,
) {
  if (!childIds.length) return 0;

  const padR = cfg.CHILD_RING_PAD + cfg.GAP;

  const p = nodeSize(cy, parentId, cfg);
  const childSizes = childIds.map(id => nodeSize(cy, id, cfg));
  const widths = childSizes.map(s => s.w);

  const parentCirc = 0.5 * Math.hypot(p.w, p.h);
  const maxChildCirc = Math.max(...childSizes.map(s => 0.5 * Math.hypot(s.w, s.h)));
  let lo = Math.max(parentCirc + maxChildCirc + padR, cfg.EPS);
  let hi = lo;

  const targetSpan = Math.max(0, 2 * Math.PI - Math.max(cfg.EPS, wrapGap));

  const fits = (R: number) => {
    let acc = -targetSpan / 2;
    let sum = 0;

    for (let i = 0; i < childIds.length; i++) {
      const angWidth = childAngleForWidth(widths[i], cfg.GAP, R, cfg.EPS);
      const thetaMid = acc + angWidth / 2;

      const ux = Math.cos(thetaMid);
      const uy = Math.sin(thetaMid);
      const needRad = supportOnDir(p.w, p.h, ux, uy) + supportOnDir(childSizes[i].w, childSizes[i].h, ux, uy) + padR;
      if (R + 1e-9 < needRad) return false;

      sum += angWidth;
      acc += angWidth;
    }
    return sum * cfg.ARC_TIGHTEN <= targetSpan + 1e-12;
  };

  for (let k = 0; k < 32 && !fits(hi); k++) hi *= 1.6;

  for (let it = 0; it < 48; it++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

export function placeKidsCircleLocal(
  cy: Core,
  parentId: string,
  childIds: string[],
  cfg: ClusteredLayoutConfig,
  out: Record<string, Pos>,
) {
  if (!childIds.length) return;

  const R = fitCircleRadiusForKids(cy, parentId, childIds, cfg, cfg.RING_MIN_DEG);
  const widths = childIds.map(id => nodeSize(cy, id, cfg).w);
  const angles = widths.map(w => childAngleForWidth(w, cfg.GAP, R, cfg.EPS));

  let acc = -Math.max(0, Math.PI * 2 - Math.max(cfg.EPS, cfg.RING_MIN_DEG)) / 2;
  const baseAngles = angles.map(a => {
    const m = acc + a / 2;
    acc += a;
    return m;
  });

  out[parentId] = { x: 0, y: 0 };
  for (let i = 0; i < childIds.length; i++) {
    out[childIds[i]] = polar(0, 0, R, baseAngles[i]);
  }

  // One-shot local shrink (children vs parent and vs each other)
  {
    const parentSize = nodeSizeWithLabels(cy, parentId);
    const parentPadding = cfg.CHILD_RING_PAD + cfg.GAP;
    const parentRectInflated = {
      x: -(parentSize.w / 2 + parentPadding),
      y: -(parentSize.h / 2 + parentPadding),
      w: parentSize.w + 2 * parentPadding,
      h: parentSize.h + 2 * parentPadding,
    };

    const items = childIds.map(id => {
      const nodeSize = nodeSizeWithLabels(cy, id);
      const nodePosition = out[id];
      return { id, w: nodeSize.w, h: nodeSize.h, x: nodePosition.x, y: nodePosition.y };
    });

    const { positions } = shrinkAlongRaysToAvoidCollisions({
      items,
      center: { x: 0, y: 0 },
      parentRect: parentRectInflated,
      maxIters: 40,
      eps: Math.max(cfg.EPS, 1e-4),
      allowExpand: true, // robust if initial placement already collides
    });

    for (const id of childIds) out[id] = positions[id];
  }
}

/** Special-cased compact 4 children grid around parent. */
export function placeKidsGrid4Local(
  cy: Core,
  parentId: string,
  childIds: string[],
  cfg: ClusteredLayoutConfig,
  out: Record<string, Pos>,
) {
  const pb = nodeSize(cy, parentId, cfg);
  const cx = 0;
  const topY = -pb.h / 2 - cfg.FOUR_GRID_ROW_PAD;
  const bottomY = pb.h / 2 + cfg.FOUR_GRID_ROW_PAD;

  const placeTopLR = (l?: string, r?: string) => {
    if (l) {
      const s = nodeSize(cy, l, cfg);
      out[l] = { x: cx - cfg.FOUR_GRID_INNER_GAP / 2 - s.w / 2, y: topY - s.h / 2 };
    }
    if (r) {
      const s = nodeSize(cy, r, cfg);
      out[r] = { x: cx + cfg.FOUR_GRID_INNER_GAP / 2 + s.w / 2, y: topY - s.h / 2 };
    }
  };
  const placeBottomLR = (l?: string, r?: string) => {
    if (l) {
      const s = nodeSize(cy, l, cfg);
      out[l] = { x: cx - cfg.FOUR_GRID_INNER_GAP / 2 - s.w / 2, y: bottomY + s.h / 2 };
    }
    if (r) {
      const s = nodeSize(cy, r, cfg);
      out[r] = { x: cx + cfg.FOUR_GRID_INNER_GAP / 2 + s.w / 2, y: bottomY + s.h / 2 };
    }
  };

  const [tl, tr, bl, br] = childIds;
  placeTopLR(tl, tr);
  placeBottomLR(bl, br);
}

export function placeSingleChildRadialOutwardIterative(
  cy: Core,
  parentId: string,
  childId: string,
  local: {
    localPos: Record<string, Pos>;
    innerBBox: { w: number; h: number; cx: number; cy: number };
    outerRect: { w: number; h: number };
  },
  rootCx: number,
  rootCy: number,
  clusterCenter: { x: number; y: number },
  cfg: ClusteredLayoutConfig,
) {
  // Base outward placement (same as non-iterative)
  const pSize = nodeSize(cy, parentId, cfg);
  const cSize = nodeSize(cy, childId, cfg);
  let ux = clusterCenter.x - rootCx;
  let uy = clusterCenter.y - rootCy;
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;

  const support = (w: number, h: number) => 0.5 * w * Math.abs(ux) + 0.5 * h * Math.abs(uy);
  const pad = cfg.CHILD_RING_PAD + cfg.GAP;
  const d = support(pSize.w, pSize.h) + support(cSize.w, cSize.h) + pad;

  local.localPos[parentId] = { x: 0, y: 0 };
  local.localPos[childId] = { x: ux * d, y: uy * d };

  // Iterative shrink (angles fixed). For single child this converges in 1 step.
  const items = [childId].map(id => {
    const sz = nodeSizeWithLabels(cy, id);
    const p = local.localPos[id];
    return { id, w: sz.w + 2 * cfg.GAP, h: sz.h + 2 * cfg.GAP, x: p.x, y: p.y };
  });

  const pLab = nodeSizeWithLabels(cy, parentId);
  const parentPad = cfg.CHILD_RING_PAD + cfg.GAP;
  const parentRectInflated = {
    x: -(pLab.w / 2 + parentPad),
    y: -(pLab.h / 2 + parentPad),
    w: pLab.w + 2 * parentPad,
    h: pLab.h + 2 * parentPad,
  };

  const bestPos: Record<string, Pos> = { ...local.localPos };
  let bestArea = Number.POSITIVE_INFINITY;

  const evalAndCommit = () => {
    const { positions } = shrinkAlongRaysToAvoidCollisions({
      items,
      center: { x: 0, y: 0 },
      parentRect: parentRectInflated,
      maxIters: 40,
      eps: Math.max(cfg.EPS, 1e-4),
      allowExpand: true,
    });
    const tmp: Record<string, Pos> = { [parentId]: { x: 0, y: 0 }, [childId]: positions[childId] };
    const bb = computeBBox(cy, [parentId, childId], tmp, nodeSize, cfg);
    const area = (bb.w + 2 * cfg.CLUSTER_PAD) * (bb.h + 2 * cfg.CLUSTER_PAD);
    if (area < bestArea) {
      bestArea = area;
      bestPos[childId] = positions[childId];
    }
  };

  for (let iter = 0; iter < 2; iter++) evalAndCommit();

  local.localPos[parentId] = { x: 0, y: 0 };
  local.localPos[childId] = bestPos[childId];

  const ids = [parentId, childId];
  const bbox = computeBBox(cy, ids, local.localPos, nodeSize, cfg);
  local.innerBBox = { w: bbox.w, h: bbox.h, cx: bbox.cx, cy: bbox.cy };
  local.outerRect = { w: bbox.w + 2 * cfg.CLUSTER_PAD, h: bbox.h + 2 * cfg.CLUSTER_PAD };
}

/** Place a single child locally (choose horizontal vs vertical by area). */
export function placeSingleChildLocal(
  cy: Core,
  parentId: string,
  childId: string,
  cfg: ClusteredLayoutConfig,
  out: Record<string, Pos>,
) {
  const parentSize = nodeSizeWithLabels(cy, parentId);
  const childSize = nodeSizeWithLabels(cy, childId);

  const gap = cfg.GAP;
  const ringPad = cfg.CHILD_RING_PAD;

  const placeAndMeasure = (pos: Pos) => {
    const tmp: Record<string, Pos> = { [parentId]: { x: 0, y: 0 }, [childId]: pos };
    const bbox = computeBBox(cy, [parentId, childId], tmp, nodeSizeWithLabels, cfg);
    const packW = bbox.w + 2 * cfg.CLUSTER_PAD;
    const packH = bbox.h + 2 * cfg.CLUSTER_PAD;
    return { pos, area: packW * packH, packW, packH };
  };

  // Horizontal (child to the right)
  const dxH = parentSize.w / 2 + ringPad + gap + childSize.w / 2;
  const horiz = placeAndMeasure({ x: dxH, y: 0 });

  // Vertical (child below)
  const dyV = parentSize.h / 2 + ringPad + gap + childSize.h / 2;
  const vert = placeAndMeasure({ x: 0, y: dyV });

  const best = horiz.area <= vert.area ? horiz : vert;

  out[parentId] = { x: 0, y: 0 };
  out[childId] = best.pos;
}

/** Iterative outward placement for TWO children: try small tangential jitters + shrink, keep best. */
export function placeTwoChildrenRadialOutwardIterative(
  cy: Core,
  parentId: string,
  ids: string[],
  local: {
    localPos: Record<string, Pos>;
    innerBBox: { w: number; h: number; cx: number; cy: number };
    outerRect: { w: number; h: number };
  },
  rootCx: number,
  rootCy: number,
  clusterCenter: { x: number; y: number },
  cfg: ClusteredLayoutConfig,
) {
  const [childA, childB] = ids;
  const parentSize = nodeSize(cy, parentId, cfg);
  const firstChildSize = nodeSize(cy, childA, cfg);
  const secondChildSize = nodeSize(cy, childB, cfg);

  let ux = clusterCenter.x - rootCx;
  let uy = clusterCenter.y - rootCy;
  const L = Math.hypot(ux, uy) || 1;
  ux /= L;
  uy /= L;

  const vx = -uy,
    vy = ux;
  const support = (w: number, h: number, ax: number, ay: number) => 0.5 * w * Math.abs(ax) + 0.5 * h * Math.abs(ay);

  const padR = cfg.CHILD_RING_PAD + cfg.GAP;
  const sPu = support(parentSize.w, parentSize.h, ux, uy);
  const sAu = support(firstChildSize.w, firstChildSize.h, ux, uy);
  const sBu = support(secondChildSize.w, secondChildSize.h, ux, uy);
  const sAv = support(firstChildSize.w, firstChildSize.h, vx, vy);
  const sBv = support(secondChildSize.w, secondChildSize.h, vx, vy);

  const dA = sPu + sAu + padR;
  const dB = sPu + sBu + padR;
  const tMin = (sAv + sBv + cfg.GAP) / 2;

  const place = (t: number) => {
    const firstChildPosition = { x: ux * dA + vx * t, y: uy * dA + vy * t };
    const secondChildPosition = { x: ux * dB - vx * t, y: uy * dB - vy * t };
    local.localPos[parentId] = { x: 0, y: 0 };
    local.localPos[childA] = firstChildPosition;
    local.localPos[childB] = secondChildPosition;
  };

  const pLab = nodeSizeWithLabels(cy, parentId);
  const parentPad = cfg.CHILD_RING_PAD + cfg.GAP;
  const parentRectInflated = {
    x: -(pLab.w / 2 + parentPad),
    y: -(pLab.h / 2 + parentPad),
    w: pLab.w + 2 * parentPad,
    h: pLab.h + 2 * parentPad,
  };

  const idsAll = [parentId, childA, childB];

  const evalLayout = (): { area: number; pos: Record<string, Pos> } => {
    const items = [childA, childB].map(id => {
      const size = nodeSizeWithLabels(cy, id);
      const p0 = local.localPos[id];
      return { id, w: size.w + 2 * cfg.GAP, h: size.h + 2 * cfg.GAP, x: p0.x, y: p0.y };
    });
    const { positions } = shrinkAlongRaysToAvoidCollisions({
      items,
      center: { x: 0, y: 0 },
      parentRect: parentRectInflated,
      maxIters: 40,
      eps: Math.max(cfg.EPS, 1e-4),
      allowExpand: true,
    });
    const tmp = { [parentId]: { x: 0, y: 0 }, [childA]: positions[childA], [childB]: positions[childB] } as Record<
      string,
      Pos
    >;
    const bb = computeBBox(cy, idsAll, tmp, nodeSize, cfg);
    const area = (bb.w + 2 * cfg.CLUSTER_PAD) * (bb.h + 2 * cfg.CLUSTER_PAD);
    return { area, pos: tmp };
  };

  let bestArea = Number.POSITIVE_INFINITY;
  let bestPos: Record<string, Pos> = {};

  // Candidate t values around minimal separation
  const candidates = [1.0, 1.15, 1.3].map(f => Math.max(tMin, f * tMin));
  for (let iter = 0; iter < 2; iter++) {
    for (const t of candidates) {
      place(t);
      const { area, pos } = evalLayout();
      if (area < bestArea) {
        bestArea = area;
        bestPos = pos;
      }
    }
  }

  local.localPos[parentId] = { x: 0, y: 0 };
  local.localPos[childA] = bestPos[childA];
  local.localPos[childB] = bestPos[childB];

  const bbox = computeBBox(cy, idsAll, local.localPos, nodeSize, cfg);
  local.innerBBox = { w: bbox.w, h: bbox.h, cx: bbox.cx, cy: bbox.cy };
  local.outerRect = { w: bbox.w + 2 * cfg.CLUSTER_PAD, h: bbox.h + 2 * cfg.CLUSTER_PAD };
}

/** Iterative outward placement for THREE children on an arc with span tightening between shrink steps. */
export function placeThreeChildrenRadialOutwardIterative(
  cy: Core,
  parentId: string,
  ids: string[],
  local: {
    localPos: Record<string, Pos>;
    innerBBox: { w: number; h: number; cx: number; cy: number };
    outerRect: { w: number; h: number };
  },
  rootCx: number,
  rootCy: number,
  clusterCenter: { x: number; y: number },
  cfg: ClusteredLayoutConfig,
) {
  /**
   * --- Stable, deterministic identity → angle mapping ---
   * We intentionally DO NOT derive the L/C/R order from current angles.
   * Instead we fix a canonical order by id and ALWAYS map:
   *  left = baseOrder[0], center = baseOrder[1], right = baseOrder[2].
   * This removes any possibility of cyclic wrap/tie jitter between runs.
   */
  const baseOrder = ids.slice().sort((a, b) => a.localeCompare(b));
  const leftId = baseOrder[0];
  const centerId = baseOrder[1];
  const rightId = baseOrder[2];

  // Outward direction: root -> cluster center
  const tx = clusterCenter.x - rootCx;
  const ty = clusterCenter.y - rootCy;
  const targetAngle = Math.atan2(ty, tx);

  // Baseline radius from current local positions (fallback to 1)
  const r0s = ids.map(id => Math.hypot(local.localPos[id]?.x ?? 0, local.localPos[id]?.y ?? 0));
  const rMean = r0s.reduce((a, b) => a + b, 0) / Math.max(1, r0s.length) || 1;

  // Compute minimal span by widths so three nodes fit on the arc
  const widths = ids.map(id => nodeSize(cy, id, cfg).w);
  const baseAngles = widths.map(w => childAngleForWidth(w, cfg.GAP, rMean, cfg.EPS));
  const minSpanByWidths = Math.max(...baseAngles) * 3 + cfg.EPS;
  const minSpan = Math.min(cfg.SPAN_BY_COUNT.three ?? cfg.SPAN_BY_COUNT.default, minSpanByWidths);

  // Fixed L/C/R → angle mapper (depends ONLY on span and targetAngle)
  const placeOnArc = (span: number) => {
    const angLeft = targetAngle - 0.5 * span;
    const angCtr = targetAngle;
    const angRight = targetAngle + 0.5 * span;

    local.localPos[leftId] = polar(0, 0, rMean, angLeft);
    local.localPos[centerId] = polar(0, 0, rMean, angCtr);
    local.localPos[rightId] = polar(0, 0, rMean, angRight);
  };

  // Inflate parent rect to keep a moat for children while shrinking along rays
  const pLab = nodeSizeWithLabels(cy, parentId);
  const parentPad = cfg.CHILD_RING_PAD + cfg.GAP;
  const parentRectInflated = {
    x: -(pLab.w / 2 + parentPad),
    y: -(pLab.h / 2 + parentPad),
    w: pLab.w + 2 * parentPad,
    h: pLab.h + 2 * parentPad,
  };

  // Evaluate layout area after collision-avoidance shrink along rays
  const evalLayout = (): { area: number; pos: Record<string, Pos> } => {
    const items = ids.map(id => {
      const size = nodeSizeWithLabels(cy, id);
      const p0 = local.localPos[id];
      return { id, w: size.w + 2 * cfg.GAP, h: size.h + 2 * cfg.GAP, x: p0.x, y: p0.y };
    });

    const { positions } = shrinkAlongRaysToAvoidCollisions({
      items,
      center: { x: 0, y: 0 },
      parentRect: parentRectInflated,
      maxIters: 40,
      eps: Math.max(cfg.EPS, 1e-4),
      allowExpand: true,
    });

    const tmp: Record<string, Pos> = { [parentId]: { x: 0, y: 0 } };
    for (const id of ids) tmp[id] = positions[id];

    const bb = computeBBox(cy, [parentId, ...ids], tmp, nodeSize, cfg);
    const area = (bb.w + 2 * cfg.CLUSTER_PAD) * (bb.h + 2 * cfg.CLUSTER_PAD);
    return { area, pos: tmp };
  };

  // Try a few arc spans, but KEEP the same identity→slot mapping each time
  let bestArea = Number.POSITIVE_INFINITY;
  let bestPos: Record<string, Pos> = {};

  const scales = [1.0, 0.9, 0.8];
  for (let pass = 0; pass < 2; pass++) {
    for (const s of scales) {
      const span = Math.max(minSpan, s * spanByCount(3, cfg));
      placeOnArc(span);
      const { area, pos } = evalLayout();
      if (area < bestArea) {
        bestArea = area;
        bestPos = pos;
      }
    }
  }

  // Commit best
  local.localPos[parentId] = { x: 0, y: 0 };
  for (const id of ids) local.localPos[id] = bestPos[id];

  const bbox = computeBBox(cy, [parentId, ...ids], local.localPos, nodeSize, cfg);
  local.innerBBox = { w: bbox.w, h: bbox.h, cx: bbox.cx, cy: bbox.cy };
  local.outerRect = { w: bbox.w + 2 * cfg.CLUSTER_PAD, h: bbox.h + 2 * cfg.CLUSTER_PAD };
}

/**
 * Rotate the >4-children ring so the largest empty arc faces the root,
 * then run several cycles of:
 *    shrink (radial) → angular relaxation (tangential) → shrink (radial)
 * The angular relaxation gently redistributes angles so that each consecutive
 * pair (i,i+1) satisfies a minimal required gap based on their widths and
 * current radii:  gap(i) >= (α_i + α_{i+1}) / 2 where α_k = childAngleForWidth(w_k, GAP, r_k).
 */
export function orientManyChildrenRadialOutwardIterative(
  cy: Core,
  parentId: string,
  childIds: string[],
  local: {
    localPos: Record<string, Pos>;
    innerBBox: { w: number; h: number; cx: number; cy: number };
    outerRect: { w: number; h: number };
  },
  rootCx: number,
  rootCy: number,
  clusterCenter: { x: number; y: number },
  cfg: ClusteredLayoutConfig,
) {
  if (childIds.length <= 4) return;

  // ---- Deterministic, stable ordering ----
  // Fix a canonical cyclic order by id to remove run-to-run jitter.
  const order = childIds.slice().sort((a, b) => a.localeCompare(b));

  // Inward direction (cluster -> root): we will center the FREE gap here.
  const inwardAngle = Math.atan2(rootCy - clusterCenter.y, rootCx - clusterCenter.x);

  // Ring geometry: use full ring except for a small reserved "wrap gap".
  const TAU = Math.PI * 2;
  const wrapGap = Math.max(cfg.EPS, cfg.RING_MIN_DEG);
  const usedSpan = Math.max(cfg.EPS, TAU - wrapGap);

  // Radius that fits all children on the used arc.
  const R = fitCircleRadiusForKids(cy, parentId, order, cfg, wrapGap);

  // Minimal angular widths required by node widths on radius R.
  const widths = order.map(id => nodeSize(cy, id, cfg).w);
  const minSeg = widths.map(w => childAngleForWidth(w, cfg.GAP, R, cfg.EPS));

  // Distribute slack uniformly so total equals usedSpan (keeps shape stable).
  const sumMin = minSeg.reduce((s, a) => s + a, 0);
  const scale = sumMin > 0 ? usedSpan / sumMin : 1;
  const seg = minSeg.map(a => a * scale);

  // Lay mid-angles over [-usedSpan/2, +usedSpan/2] (used arc centered at 0).
  let acc = -usedSpan / 2;
  const mids: number[] = [];
  for (let i = 0; i < seg.length; i++) {
    const a = seg[i];
    const mid = acc + a / 2;
    mids.push(mid);
    acc += a;
  }

  // Rotate so that the UNUSED gap (wrapGap) is centered at inwardAngle.
  // Since used arc is centered at 0, center it at inwardAngle + π.
  const rot = inwardAngle + Math.PI;

  // Initial placement
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    const ang = mids[i] + rot;
    local.localPos[id] = polar(0, 0, R, ang);
  }

  // Parent moat for radial shrink
  const pLab = nodeSizeWithLabels(cy, parentId);
  const parentPad = cfg.CHILD_RING_PAD + cfg.GAP;
  const parentRectInflated = {
    x: -(pLab.w / 2 + parentPad),
    y: -(pLab.h / 2 + parentPad),
    w: pLab.w + 2 * parentPad,
    h: pLab.h + 2 * parentPad,
  };

  // Radial shrink to clear collisions (keeps angles/ordering intact).
  const items = order.map(id => {
    const sz = nodeSizeWithLabels(cy, id);
    const p0 = local.localPos[id];
    return { id, w: sz.w + 2 * cfg.GAP, h: sz.h + 2 * cfg.GAP, x: p0.x, y: p0.y };
  });

  const { positions } = shrinkAlongRaysToAvoidCollisions({
    items,
    center: { x: 0, y: 0 },
    parentRect: parentRectInflated,
    maxIters: 60,
    eps: Math.max(cfg.EPS, 1e-4),
    allowExpand: true,
  });

  for (const id of order) {
    local.localPos[id] = positions[id];
  }

  // Update cluster bbox
  local.localPos[parentId] = { x: 0, y: 0 };
  const idsAll = [parentId, ...childIds];
  const bbox = computeBBox(cy, idsAll, local.localPos, nodeSize, cfg);
  local.innerBBox = { w: bbox.w, h: bbox.h, cx: bbox.cx, cy: bbox.cy };
  local.outerRect = { w: bbox.w + 2 * cfg.CLUSTER_PAD, h: bbox.h + 2 * cfg.CLUSTER_PAD };
}
