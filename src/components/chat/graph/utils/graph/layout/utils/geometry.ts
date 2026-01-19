import { RectTL } from '../types/shared';

export const TAU = Math.PI * 2;

export function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

/** Rectangle center -> top-left. */
export function rectCtoTL(r: RectTL): RectTL {
  return { x: r.x - r.w / 2, y: r.y - r.h / 2, w: r.w, h: r.h };
}

/** Axis-aligned top-left rectangle intersection (strictly positive area). */
export function intersects(a: RectTL, b: RectTL): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function outsideContainer(r: RectTL, CW: number, CH: number): boolean {
  return r.x < 0 || r.y < 0 || r.x + r.w > CW || r.y + r.h > CH;
}

/** Radius of the circumcircle of an axis-aligned rectangle (w,h). */
export function circRadiusOfRect(w: number, h: number) {
  return 0.5 * Math.hypot(w, h);
}

/** Inflate a rectangle W×H by a scalar gap on both axes (no rotation). */
export function inflateWH(w: number, h: number, gap: number) {
  const g = Math.max(0, gap);
  return { w: w + g, h: h + g };
}

/** Support function for a rectangle along unit direction (ux,uy). */
export function supportOnDir(w: number, h: number, ux: number, uy: number) {
  return 0.5 * w * Math.abs(ux) + 0.5 * h * Math.abs(uy);
}

/** Interleave big/small items to avoid local bottlenecks on the ring. */
export function arrangeBalanced<T>(items: T[], weight: (t: T) => number): T[] {
  const sorted = [...items].sort((a, b) => weight(b) - weight(a));
  const out: T[] = [];
  let l = 0,
    r = sorted.length - 1,
    toggle = true;
  while (l <= r) {
    out.push(toggle ? sorted[l++] : sorted[r--]);
    toggle = !toggle;
  }
  return out;
}

/** Helper: convert center-rect to TL without re-importing. */
export function rectCenterToTL(r: RectTL) {
  return rectCtoTL(r);
}

export function inflateTL(r: RectTL, pad: number): RectTL {
  return { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad };
}

export function rectTLContains(r: RectTL, x: number, y: number) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function distPointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax,
    vy = by - ay;
  const wx = px - ax,
    wy = py - ay;
  const vv = vx * vx + vy * vy;
  let t = vv > 0 ? (wx * vx + wy * vy) / vv : 0;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = ax + t * vx,
    cy = ay + t * vy;
  return Math.hypot(px - cx, py - cy);
}

export function segIntersects(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const orient = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) =>
    Math.sign((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1));
  const onSeg = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) =>
    Math.min(x1, x2) - 1e-9 <= x &&
    x <= Math.max(x1, x2) + 1e-9 &&
    Math.min(y1, y2) - 1e-9 <= y &&
    y <= Math.max(y1, y2) + 1e-9 &&
    Math.abs((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) <= 1e-9;

  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSeg(ax, ay, bx, by, cx, cy)) return true;
  if (o2 === 0 && onSeg(ax, ay, bx, by, dx, dy)) return true;
  if (o3 === 0 && onSeg(cx, cy, dx, dy, ax, ay)) return true;
  if (o4 === 0 && onSeg(cx, cy, dx, dy, bx, by)) return true;
  return false;
}

/** Min distance between segment AB and rect r (0 if touches/intersects). */
export function minDistanceSegmentToRect(ax: number, ay: number, bx: number, by: number, r: RectTL): number {
  if (rectTLContains(r, ax, ay) || rectTLContains(r, bx, by)) return 0;

  const x1 = r.x,
    y1 = r.y,
    x2 = r.x + r.w,
    y2 = r.y + r.h;
  const edges: ReadonlyArray<[number, number, number, number]> = [
    [x1, y1, x2, y1],
    [x2, y1, x2, y2],
    [x2, y2, x1, y2],
    [x1, y2, x1, y1],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (segIntersects(ax, ay, bx, by, ex1, ey1, ex2, ey2)) return 0;
  }

  let best = Infinity;
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const d = Math.min(
      distPointToSegment(ax, ay, ex1, ey1, ex2, ey2),
      distPointToSegment(bx, by, ex1, ey1, ex2, ey2),
      distPointToSegment(ex1, ey1, ax, ay, bx, by),
      distPointToSegment(ex2, ey2, ax, ay, bx, by),
    );
    if (d < best) best = d;
  }
  return best;
}
