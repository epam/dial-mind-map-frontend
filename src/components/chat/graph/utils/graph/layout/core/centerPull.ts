import { Core } from 'cytoscape';

import { ClusteredLayoutConfig } from '../types/config';
import { Margins, Pos, RectTL } from '../types/shared';
import { nodeRectAt } from '../utils/cytoscape';
import { inflateTL, minDistanceSegmentToRect } from '../utils/geometry';

type CenterPullParams = {
  levelOne: string[];
  childrenByParent: Record<string, string[]>;
  packedRects: Record<string, RectTL>;
  rootId: string;
  cfg: ClusteredLayoutConfig;
};

type FailReason =
  | 'ok'
  | 'not_inward'
  | 'corridor_blocked'
  | 'root_moat'
  | 'node_node'
  | 'pack_footprint'
  | 'edge_nonincident'
  | 'incident_edge';

type CenterCorridorReport = {
  ok: boolean;
  halfWidth: number;
  centerExtentAlongR?: number;
  minChildR?: number;
  consideredChildren: string[];
  ignoredChildren: string[];
  blockers: Array<{ id: string; label: string; d: number; type: 'child' | 'other'; pos: Pos }>;
};

type CenterOutcome =
  | {
      moved: true;
      bestT: number;
      delta: { dx: number; dy: number };
      after: Pos;
      post: { dCR: number; medianChildRadius: number; ratio: number };
    }
  | {
      moved: false;
      reason: FailReason;
      lastFail?: any;
    };

type CenterReport = {
  id: string;
  label: string;
  before: Pos;
  dCR: number;
  cRect: RectTL;
  target: any;
  packInfo?: any;
  corridor?: CenterCorridorReport;
  diagSweep?: Array<{ t: number; ok: boolean; reason: FailReason; culprit?: string; details?: any }>;
  outcome?: CenterOutcome;
  packMode?: string;
  insidePackAtStart?: boolean;
};

type RunReport = {
  meta: {
    centers: number;
    totalNodes: number;
    edges: number;
    gap: number;
    edgeClearance: number;
    root: { pos: Pos; rect?: RectTL; moat: RectTL };
    opts: Record<string, any>;
    packMisfits?: Array<any>;
  };
  centers: CenterReport[];
  summary: { moved: number; stayed: number; reasons: Record<string, number> };
};

function median(a: number[]): number {
  if (!a.length) return 0;
  const v = a.slice().sort((x, y) => x - y);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
function rectsOverlap(a: RectTL, b: RectTL): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}
function nodeLabel(cy: Core, id: string): string {
  const el = cy.$id(id);
  return el.data('label') ?? el.data('neon') ?? id;
}
const fmtPos = (p: Pos) => ({ x: +p.x.toFixed(2), y: +p.y.toFixed(2) });
const fmtRect = (r: RectTL): RectTL => ({
  x: +r.x.toFixed(2),
  y: +r.y.toFixed(2),
  w: +r.w.toFixed(2),
  h: +r.h.toFixed(2),
});

/** Support extent (half-size) of axis-aligned rect along unit direction (ux,uy). */
function extentAlong(rect: RectTL, ux: number, uy: number) {
  const hx = rect.w / 2,
    hy = rect.h / 2;
  return Math.abs(ux) * hx + Math.abs(uy) * hy;
}
function packMargins(cRect: RectTL, pack: RectTL, gap: number): Margins {
  const left = cRect.x - (pack.x + gap);
  const right = pack.x + pack.w - gap - (cRect.x + cRect.w);
  const top = cRect.y - (pack.y + gap);
  const bottom = pack.y + pack.h - gap - (cRect.y + cRect.h);
  return { left: +left.toFixed(2), right: +right.toFixed(2), top: +top.toFixed(2), bottom: +bottom.toFixed(2) };
}
/** t upper bound from pack only for motion along C->T (when starting INSIDE). */
function packMaxTAlong(C: Pos, T: Pos, cRect0: RectTL, pack: RectTL, gap: number) {
  const dirx = T.x - C.x,
    diry = T.y - C.y;
  if (Math.abs(dirx) < 1e-9 && Math.abs(diry) < 1e-9) return 1;

  const cx0 = cRect0.x + cRect0.w / 2;
  const cy0 = cRect0.y + cRect0.h / 2;
  const minX = pack.x + gap + cRect0.w / 2;
  const maxX = pack.x + pack.w - gap - cRect0.w / 2;
  const minY = pack.y + gap + cRect0.h / 2;
  const maxY = pack.y + pack.h - gap - cRect0.h / 2;

  let tMax = 1;
  if (Math.abs(dirx) > 1e-9) {
    const tx1 = (minX - cx0) / dirx;
    const tx2 = (maxX - cx0) / dirx;
    const tx = dirx > 0 ? tx2 : tx1;
    if (isFinite(tx)) tMax = Math.min(tMax, tx);
  }
  if (Math.abs(diry) > 1e-9) {
    const ty1 = (minY - cy0) / diry;
    const ty2 = (maxY - cy0) / diry;
    const ty = diry > 0 ? ty2 : ty1;
    if (isFinite(ty)) tMax = Math.min(tMax, ty);
  }
  return Math.max(0, Math.min(1, tMax));
}

export function applyFinalCenterPull(cy: Core, positions: Record<string, Pos>, params: CenterPullParams) {
  const { levelOne, childrenByParent, packedRects, rootId, cfg } = params;

  // ---- options -----------------------------------------------------------
  const DEBUG: boolean = (cfg.CENTER_PULL_DEBUG ?? cfg.DEBUG_LOG) as boolean;
  const VERBOSE: boolean = (cfg.CENTER_PULL_DEBUG_VERBOSE ?? false) as boolean;
  const SWEEP_STEPS: number = Number(cfg.CENTER_PULL_DIAG_SWEEP_STEPS ?? 0);
  const PACK_SLACK: number = Number(cfg.CENTER_PULL_PACK_SLACK ?? 0);
  const IGNORE_PACK: boolean = (cfg.CENTER_PULL_IGNORE_PACK ?? false) as boolean;

  const TARGET_STRATEGY: 'median-centers' | 'boundary' = cfg.CENTER_PULL_TARGET_STRATEGY ?? 'median-centers';

  const CHILD_FACTOR: number = Number(cfg.CENTER_PULL_CORRIDOR_CHILD_FACTOR ?? 0);
  const ALLOW_OUTWARD: boolean = (cfg.CENTER_PULL_ALLOW_OUTWARD ?? false) as boolean;
  const CORRIDOR_FACTOR: number = Number(cfg.CENTER_PULL_CORRIDOR_FACTOR ?? 1);
  const MIN_CLEARANCE: number = Number(cfg.CENTER_PULL_MIN_CLEARANCE ?? cfg.GAP ?? 0);

  const LOG_AGGREGATE: boolean = (cfg.CENTER_PULL_LOG_AGGREGATE ?? true) as boolean;
  const LOG_STREAM: boolean = (cfg.CENTER_PULL_LOG_STREAM ?? false) as boolean;

  const PACK_MODE: 'enforce' | 'enforce-if-inside' | 'ignore' = cfg.CENTER_PULL_PACK_MODE ?? 'enforce-if-inside';

  const LOG_PREFIX = (cfg.LOG_PREFIX ?? '[layout]') as string;
  const LOG = (...a: any[]) => {
    if (DEBUG && LOG_STREAM) console.log(LOG_PREFIX, '[center-pull]', ...a);
  };
  const VLOG = (...a: any[]) => {
    if (DEBUG && VERBOSE && LOG_STREAM) console.log(LOG_PREFIX, '[center-pull:verbose]', ...a);
  };

  const REPORT: RunReport = {
    meta: {
      centers: 0,
      totalNodes: 0,
      edges: 0,
      gap: 0,
      edgeClearance: 0,
      root: { pos: { x: 0, y: 0 }, moat: { x: 0, y: 0, w: 0, h: 0 } },
      opts: {},
      packMisfits: [],
    },
    centers: [],
    summary: { moved: 0, stayed: 0, reasons: {} },
  };

  const rects: Record<string, RectTL> = {};
  for (const id of Object.keys(positions).sort()) {
    rects[id] = nodeRectAt(cy, id, positions[id], cfg, { includeLabels: true });
  }

  const edges = cy
    .edges()
    .map(e => ({ s: e.source().id(), t: e.target().id() }))
    .filter(e => positions[e.s] && positions[e.t]);

  const rootPos = positions[rootId];
  const rootRect = nodeRectAt(cy, rootId, rootPos, cfg, { includeLabels: true });
  const rootRectMoat = inflateTL({ ...rootRect }, cfg.ROOT_PAD);

  const gap = Math.max(0, cfg.GAP);
  const edgeClearance = gap;

  const packMisfits: Array<{ label: string; id: string; cRect: RectTL; pack: RectTL; margins: Margins }> = [];
  const packEnforce: Record<string, boolean> = {};
  for (const pid of levelOne) {
    const pack = packedRects[pid];
    if (!pack) {
      packEnforce[pid] = false;
      continue;
    }
    const cRect0 = nodeRectAt(cy, pid, positions[pid], cfg, { includeLabels: true });
    const inside =
      cRect0.x >= pack.x + gap &&
      cRect0.y >= pack.y + gap &&
      cRect0.x + cRect0.w <= pack.x + pack.w - gap &&
      cRect0.y + cRect0.h <= pack.y + pack.h - gap;

    if (!inside) {
      packMisfits.push({
        id: pid,
        label: nodeLabel(cy, pid),
        cRect: fmtRect(cRect0),
        pack: fmtRect(packedRects[pid]),
        margins: packMargins(cRect0, packedRects[pid], gap),
      });
    }
    packEnforce[pid] = PACK_MODE === 'enforce' ? true : PACK_MODE === 'ignore' ? false : inside;
  }

  LOG('init', {
    centers: levelOne.length,
    totalNodes: Object.keys(positions).length,
    edges: edges.length,
    gap,
    edgeClearance,
    root: { pos: fmtPos(rootPos), rect: fmtRect(rootRect), moat: fmtRect(rootRectMoat) },
    opts: {
      TARGET_STRATEGY,
      ALLOW_OUTWARD,
      CORRIDOR_FACTOR,
      CHILD_FACTOR,
      PACK_SLACK,
      IGNORE_PACK,
      SWEEP_STEPS,
      MIN_CLEARANCE,
      LOG_AGGREGATE,
      LOG_STREAM,
      PACK_MODE,
    },
    packMisfits,
  });

  REPORT.meta = {
    centers: levelOne.length,
    totalNodes: Object.keys(positions).length,
    edges: edges.length,
    gap,
    edgeClearance,
    root: { pos: { x: +rootPos.x, y: +rootPos.y }, rect: rootRect, moat: rootRectMoat },
    opts: {
      TARGET_STRATEGY,
      ALLOW_OUTWARD,
      CORRIDOR_FACTOR,
      CHILD_FACTOR,
      PACK_SLACK,
      IGNORE_PACK,
      SWEEP_STEPS,
      MIN_CLEARANCE,
      LOG_AGGREGATE,
      LOG_STREAM,
      PACK_MODE,
    },
    packMisfits,
  };

  const feasibility = (pid: string, p: Pos): { ok: boolean; reason: FailReason; culprit?: string; details?: any } => {
    const cRect = nodeRectAt(cy, pid, p, cfg, { includeLabels: true });
    const cRectInfl = inflateTL(cRect, gap);

    if (rectsOverlap(cRectInfl, rootRectMoat)) {
      return { ok: false, reason: 'root_moat', details: { cRect: fmtRect(cRectInfl) } };
    }
    for (const [jid, rj] of Object.entries(rects)) {
      if (jid === pid) continue;
      if (rectsOverlap(cRectInfl, rj)) {
        return {
          ok: false,
          reason: 'node_node',
          culprit: `${jid}:${nodeLabel(cy, jid)}`,
          details: { cRect: fmtRect(cRectInfl), other: fmtRect(rj) },
        };
      }
    }
    if (!IGNORE_PACK) {
      const pack = packedRects[pid] && inflateTL(packedRects[pid], PACK_SLACK);
      if (pack && packEnforce[pid]) {
        const inside =
          cRect.x >= pack.x + gap &&
          cRect.y >= pack.y + gap &&
          cRect.x + cRect.w <= pack.x + pack.w - gap &&
          cRect.y + cRect.h <= pack.y + pack.h - gap;
        if (!inside) {
          return {
            ok: false,
            reason: 'pack_footprint',
            details: { cRect: fmtRect(cRect), pack: fmtRect(pack), margins: packMargins(cRect, pack, gap) },
          };
        }
      }
    }
    for (const e of edges) {
      if (e.s === pid || e.t === pid) continue;
      const a = positions[e.s],
        b = positions[e.t];
      const d = minDistanceSegmentToRect(a.x, a.y, b.x, b.y, cRect);
      if (d < edgeClearance) {
        return {
          ok: false,
          reason: 'edge_nonincident',
          culprit: `${e.s}→${e.t}`,
          details: { d, need: edgeClearance, cRect: fmtRect(cRect) },
        };
      }
    }
    const kids = childrenByParent[pid] || [];
    const segs = [
      { ax: p.x, ay: p.y, bx: rootPos.x, by: rootPos.y, tag: 'C→R' },
      ...kids.map(cid => {
        const kp = positions[cid];
        return { ax: p.x, ay: p.y, bx: kp.x, by: kp.y, tag: `C→child(${cid})` };
      }),
    ];
    for (const seg of segs) {
      for (const [jid, rj] of Object.entries(rects)) {
        if (jid === pid || jid === rootId) continue;
        if (kids.includes(jid)) continue;
        const d = minDistanceSegmentToRect(seg.ax, seg.ay, seg.bx, seg.by, inflateTL(rj, gap));
        if (d < edgeClearance) {
          return {
            ok: false,
            reason: 'incident_edge',
            culprit: `${jid}:${nodeLabel(cy, jid)}`,
            details: { along: seg.tag, d, need: edgeClearance, rect: fmtRect(rj) },
          };
        }
      }
    }
    return { ok: true, reason: 'ok' };
  };

  const corridorClear = (pid: string, T: Pos): CenterCorridorReport => {
    const C = positions[pid];
    const kidsArr = childrenByParent[pid] || [];
    const cRect = nodeRectAt(cy, pid, C, cfg, { includeLabels: true });

    // unit direction of actual motion
    const dx = T.x - C.x,
      dy = T.y - C.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len,
      uy = dy / len;

    const centerExtentAlongMove = extentAlong(cRect, ux, uy);

    const radii = kidsArr.map(cid => Math.hypot(positions[cid].x - C.x, positions[cid].y - C.y)).filter(v => v > 0);
    const minChildR = radii.length ? Math.min(...radii) : 0;
    const halfWidth = CORRIDOR_FACTOR * (Math.max(centerExtentAlongMove, CHILD_FACTOR * minChildR) + gap);

    const blockers: Array<{ id: string; label: string; d: number; type: 'child' | 'other'; pos: Pos }> = [];
    const consideredChildren: string[] = [];
    const ignoredChildren: string[] = [];

    for (const jid of Object.keys(rects).sort()) {
      if (jid === pid || jid === rootId) continue;
      const rj = inflateTL(rects[jid], gap);

      const isChild = kidsArr.includes(jid);
      if (isChild) {
        const K = positions[jid];
        const dot = (K.x - C.x) * ux + (K.y - C.y) * uy; // only forward
        if (dot <= 0) {
          ignoredChildren.push(`${jid}:${nodeLabel(cy, jid)}`);
          continue;
        }
        consideredChildren.push(`${jid}:${nodeLabel(cy, jid)}`);
      }

      const d = minDistanceSegmentToRect(C.x, C.y, T.x, T.y, rj);
      if (d < halfWidth) {
        blockers.push({
          id: jid,
          label: nodeLabel(cy, jid),
          d,
          type: isChild ? 'child' : 'other',
          pos: positions[jid],
        });
      }
    }

    blockers.sort((a, b) => a.d - b.d);

    LOG('corridor', {
      id: pid,
      label: nodeLabel(cy, pid),
      halfWidth: +halfWidth.toFixed(2),
      centerExtentAlongMove: +centerExtentAlongMove.toFixed(2),
      minChildR: +minChildR.toFixed(2),
      CHILD_FACTOR,
      CORRIDOR_FACTOR,
      consideredChildren,
      ignoredChildren,
      blockers: blockers.slice(0, 8).map(b => ({ ...b, d: +b.d.toFixed(2), pos: fmtPos(b.pos) })),
    });

    return {
      ok: blockers.length === 0,
      halfWidth,
      centerExtentAlongR: centerExtentAlongMove,
      minChildR,
      consideredChildren,
      ignoredChildren,
      blockers: blockers.slice(0, 8),
    };
  };

  const summary = { moved: 0, stayed: 0, reasons: new Map<FailReason, number>() };
  const bump = (r: FailReason) => summary.reasons.set(r, (summary.reasons.get(r) ?? 0) + 1);

  for (const pid of levelOne) {
    const kids = childrenByParent[pid] || [];

    const C = positions[pid],
      R = rootPos;
    const dCR = Math.hypot(C.x - R.x, C.y - R.y) || 1;

    // unit from R -> C (outward from root)
    const uxRC = (C.x - R.x) / dCR,
      uyRC = (C.y - R.y) / dCR;
    const cRect0 = nodeRectAt(cy, pid, C, cfg, { includeLabels: true });

    const CREP: CenterReport = {
      id: pid,
      label: nodeLabel(cy, pid),
      before: { x: +C.x, y: +C.y },
      dCR: +dCR.toFixed(2),
      cRect: cRect0,
      target: {},
      packMode: PACK_MODE,
      insidePackAtStart: !!packEnforce[pid],
    };
    REPORT.centers.push(CREP);

    // --- child center radii
    const radiiCenters = kids.map(cid => Math.hypot(positions[cid].x - C.x, positions[cid].y - C.y)).filter(v => v > 0);
    const rMedCenters = Math.max(0, median(radiiCenters));

    // --- boundary-safe minimum distance C↔R (prevent overlap with root)
    const centerExtentTowardRoot = extentAlong(cRect0, -uxRC, -uyRC); // from C toward root
    const rootRectForExtent = rects[rootId];
    const rootExtentTowardCenter = extentAlong(rootRectForExtent, uxRC, uyRC); // from R toward C
    const minSafe = centerExtentTowardRoot + rootExtentTowardCenter + Math.max(MIN_CLEARANCE, gap);

    // --- boundary strategy
    let targetBoundary = 0;
    if (TARGET_STRATEGY === 'boundary') {
      const childGaps: number[] = [];
      for (const cid of kids) {
        const K = positions[cid];
        const dx = K.x - C.x,
          dy = K.y - C.y;
        const len = Math.hypot(dx, dy);
        if (len <= 1e-6) continue;
        const ux = dx / len,
          uy = dy / len;
        const childRect = rects[cid];
        const cExt = extentAlong(cRect0, ux, uy);
        const kExt = extentAlong(childRect, -ux, -uy);
        childGaps.push(len - cExt - kExt);
      }
      const medGap = Math.max(0, median(childGaps));
      targetBoundary = centerExtentTowardRoot + rootExtentTowardCenter + Math.max(medGap, MIN_CLEARANCE);
    }

    // target ≈ (dCR + rMedCenters) / 2, but not less than minSafe
    const targetMidpoint = (dCR + rMedCenters) / 2;

    let targetRadius = TARGET_STRATEGY === 'median-centers' ? targetMidpoint : targetBoundary;
    targetRadius = Math.max(targetRadius, minSafe);

    // movement direction flag
    const needOutward = targetRadius > dCR + (cfg.EPS ?? 0);
    const movement: 'inward' | 'outward' = needOutward ? 'outward' : 'inward';

    // --- final target point T on the SAME ray from root as C (correct sign)
    const Tx = R.x + uxRC * targetRadius;
    const Ty = R.y + uyRC * targetRadius;
    const T: Pos = { x: Tx, y: Ty };

    const pack0 = packedRects[pid] && inflateTL(packedRects[pid], PACK_SLACK);
    const packInfo = pack0
      ? {
          pack: fmtRect(pack0),
          margins: packMargins(cRect0, pack0, gap),
          tPackMax: packEnforce[pid] ? packMaxTAlong(C, T, cRect0, pack0, gap) : 1,
        }
      : undefined;

    LOG('start', {
      id: pid,
      label: nodeLabel(cy, pid),
      children: kids.length,
      before: fmtPos(C),
      dCR: +dCR.toFixed(2),
      target: {
        strategy: TARGET_STRATEGY,
        centersMedian: +rMedCenters.toFixed(2),
        midpoint: +targetMidpoint.toFixed(2),
        boundary: +targetBoundary.toFixed(2),
        minSafe: +minSafe.toFixed(2),
        used: +targetRadius.toFixed(2),
        movement,
      },
      cRect: fmtRect(cRect0),
      packInfo: { ...(packInfo ?? {}), packMode: PACK_MODE, enforce: !!packEnforce[pid] },
      opts: { ALLOW_OUTWARD, PACK_SLACK, IGNORE_PACK },
    });

    CREP.target = {
      strategy: TARGET_STRATEGY,
      centersMedian: +rMedCenters.toFixed(2),
      midpoint: +targetMidpoint.toFixed(2),
      boundary: +targetBoundary.toFixed(2),
      minSafe: +minSafe.toFixed(2),
      used: +targetRadius.toFixed(2),
      movement,
    };
    CREP.packInfo = { ...(packInfo ?? {}), packMode: PACK_MODE, enforce: !!packEnforce[pid] };

    if (!ALLOW_OUTWARD && needOutward) {
      LOG('skip:not_inward', { id: pid, dCR: +dCR.toFixed(2), targetRadius: +targetRadius.toFixed(2) });
      CREP.outcome = { moved: false, reason: 'not_inward', lastFail: { dCR, targetRadius } };
      bump('not_inward');
      summary.stayed++;
      continue;
    }

    // corridor must be along actual motion C→T
    const corr = corridorClear(pid, T);
    CREP.corridor = corr;
    if (!corr.ok) {
      LOG('skip:corridor_blocked', { id: pid, halfWidth: +corr.halfWidth.toFixed(2), blockers: corr.blockers });
      CREP.outcome = {
        moved: false,
        reason: 'corridor_blocked',
        lastFail: { halfWidth: corr.halfWidth, blockers: corr.blockers },
      };
      bump('corridor_blocked');
      summary.stayed++;
      continue;
    }

    // --- optional coarse sweep
    if (SWEEP_STEPS > 0) {
      const report: Array<any> = [];
      for (let i = 1; i <= SWEEP_STEPS; i++) {
        const t = i / SWEEP_STEPS;
        const p = { x: C.x + (T.x - C.x) * t, y: C.y + (T.y - C.y) * t };
        const res = feasibility(pid, p);
        report.push({ t: +t.toFixed(3), ok: res.ok, reason: res.reason, culprit: res.culprit, details: res.details });
        if (!res.ok) break;
      }
      LOG('diag-sweep', { id: pid, from: fmtPos(C), to: fmtPos(T), steps: SWEEP_STEPS, report });
      CREP.diagSweep = report;
    }

    // --- binary search for largest feasible t
    let lo = 0,
      hi = 1,
      best = 0;
    let lastFail: { reason: FailReason; culprit?: string; details?: any } | null = null;

    for (let it = 0; it < 18; it++) {
      const mid = (lo + hi) / 2;
      const p = { x: C.x + (T.x - C.x) * mid, y: C.y + (T.y - C.y) * mid };
      const res = feasibility(pid, p);
      if (res.ok) {
        VLOG('ok', { id: pid, it, mid: +mid.toFixed(4), pos: fmtPos(p) });
        best = mid;
        lo = mid;
      } else {
        VLOG('fail', {
          id: pid,
          it,
          mid: +mid.toFixed(4),
          reason: res.reason,
          culprit: res.culprit,
          details: res.details,
        });
        lastFail = res;
        hi = mid;
      }
    }

    if (best > 0) {
      const p = { x: C.x + (T.x - C.x) * best, y: C.y + (T.y - C.y) * best };
      positions[pid] = p;
      rects[pid] = nodeRectAt(cy, pid, p, cfg, { includeLabels: true });

      const new_dCR = Math.hypot(p.x - R.x, p.y - R.y);
      const medChildren = median(
        kids.map(cid => Math.hypot(positions[cid].x - p.x, positions[cid].y - p.y)).filter(v => v > 0),
      );
      const outcome: CenterOutcome = {
        moved: true,
        bestT: +best.toFixed(4),
        delta: { dx: +(p.x - C.x).toFixed(2), dy: +(p.y - C.y).toFixed(2) },
        after: { x: +p.x.toFixed(2), y: +p.y.toFixed(2) },
        post: {
          dCR: +new_dCR.toFixed(2),
          medianChildRadius: +medChildren.toFixed(2),
          ratio: +(new_dCR / (medChildren || 1)).toFixed(3),
        },
      };
      LOG('moved', outcome);
      CREP.outcome = outcome;
      summary.moved++;
    } else {
      const reason: FailReason = lastFail?.reason ?? 'ok';
      const outcome: CenterOutcome = { moved: false, reason, lastFail };
      LOG('stayed', { id: pid, ...outcome });
      CREP.outcome = outcome;
      bump(reason);
      summary.stayed++;
    }
  }

  REPORT.summary = {
    moved: summary.moved,
    stayed: summary.stayed,
    reasons: Object.fromEntries(summary.reasons.entries()),
  };
  if (DEBUG && LOG_AGGREGATE) {
    console.log(LOG_PREFIX, '[center-pull:report]', REPORT);
  }
  LOG('summary', REPORT.summary);

  return positions;
}
