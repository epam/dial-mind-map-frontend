/**
 * Elliptic radial layout around the root (with rich diagnostics).
 * Safety model:
 *  - Each cluster gets a "safety radius" r_i = circumcircle(rect_i inflated by gap).
 *  - Compute minimal safe **circular** radius R0 (clears the root and fits neighbors).
 *  - Final ellipse semi-axes (rx, ry) chosen with min(rx, ry) ≥ R0 so pairwise separations hold.
 * Rectangles are not rotated; only their centers lie on the ellipse.
 */
import { Cluster, Container, Gaps, RectTL, RootSizes } from '../types/shared';
import {
  arrangeBalanced,
  circRadiusOfRect,
  inflateWH,
  intersects,
  outsideContainer,
  rectCtoTL,
  TAU,
} from '../utils/geometry';

export type Options = {
  overflowPolicy?: 'proportional' | 'none';
  packingMode?: 'compact' | 'balanced';
  maxIterations?: number;
  seed?: number;
  rootPadding?: number;
  debug?: boolean;
};

export type LayoutResult = {
  positions: Record<string, RectTL>;
  extent: { xMin: number; yMin: number; xMax: number; yMax: number };
  metrics: {
    totalOverlap: number;
    totalWhitespace: number;
    overflowAmount: { left: number; right: number; top: number; bottom: number };
    centrality: { mean: number; p95: number };
    placementsWithOverflow: number;
  };
};

type AngleBias =
  | { mode: 'sector'; center: number; halfWidth: number; strength?: number }
  | { mode: 'autoMaxSlack'; halfWidth?: number; strength?: number };

export type DebugEvent =
  | {
      type: 'probe';
      mid: number;
      sumReq: number;
      slack: number;
      gaps: number[];
      req: number[];
      slackArr: number[];
    }
  | {
      type: 'tight-blocks';
      blocks: Array<{ leftEdge: number; rightEdge: number; size: number; sLeft: number; sRight: number }>;
    }
  | { type: 'tight-shift'; detail: any }
  | {
      type: 'bottlenecks';
      angleBound: { s: number; limitEdges: number[] };
      collisionBound: { s: number; blockers: any[] };
    }
  | {
      type: 'r0';
      rootR: number;
      pairR: number;
      sumR: number;
      chosenR0: number;
      raised: boolean;
      sumAtPairR: number;
    }
  | { type: 'summary'; R0: number; rx: number; ry: number; finalScale: number };

export type EllipticOptions = {
  ellipse?: { rx?: number; ry?: number };
  onAutoRadius?: (autoRadius: number) => void;
  onAutoEllipse?: (rx: number, ry: number) => void;
  startAngle?: number;
  clockwise?: boolean;
  order?: 'balanced' | 'area' | 'given';
  rootPadding?: number;
  matchContainerAspect?: boolean;
  shrinkToTouch?:
    | boolean
    | {
        respectRoot?: boolean;
        respectContainer?: boolean;
        maxIters?: number;
        tol?: number;
        minScale?: number;
      };
  angleBias?: AngleBias;
  onDebug?: (e: DebugEvent) => void;
  debug?: boolean;
};

export function layoutClustersElliptic(
  container: Container,
  root: RootSizes,
  clusters: Cluster[],
  gaps: Gaps,
  options?: EllipticOptions,
): LayoutResult {
  const {
    ellipse,
    onAutoRadius,
    onAutoEllipse,
    startAngle = -Math.PI / 2,
    clockwise = true,
    order = 'balanced',
    rootPadding = 0,
    matchContainerAspect = true,
    shrinkToTouch = false,
    angleBias,
    onDebug,
    debug = false,
  } = options ?? {};

  const log = (...args: any[]) => {
    if (debug) console.log('[elliptic]', ...args);
  };
  const emit = (e: DebugEvent) => {
    onDebug?.(e);
    if (debug) console.log('[elliptic]', e);
  };
  const snap = (v: number, digits = 12) => +v.toFixed(digits); // reduce float jitter

  const { w: CW, h: CH } = container;
  const CX = CW / 2;
  const CY = CH / 2;
  const gap = Math.max(0, gaps.betweenClusters ?? 0);
  const EPS = 1e-6;

  const rootInfl = inflateWH(root.packW, root.packH, gap);
  const rootVoidW = rootInfl.w + 2 * rootPadding;
  const rootVoidH = rootInfl.h + 2 * rootPadding;
  const rootVoidTL = { x: CX - rootVoidW / 2, y: CY - rootVoidH / 2, w: rootVoidW, h: rootVoidH };

  // --- Build items in both "given" and "stable by id" orders (deterministic seeding)
  const toItem = (c: Cluster) => {
    const eff = inflateWH(c.packW, c.packH, gap);
    return {
      id: c.id,
      baseW: c.packW,
      baseH: c.packH,
      safeR: circRadiusOfRect(eff.w, eff.h),
      area: c.packW * c.packH,
    };
  };
  const itemsGiven = clusters.map(toItem); // as-provided order (may be non-stable upstream)
  const itemsById = [...itemsGiven].sort((a, b) => a.id.localeCompare(b.id)); // stable seed

  // --- Deterministic ordering with tie-breakers
  let ordered = itemsById as typeof itemsById;
  if (order === 'area') {
    ordered = [...itemsById].sort((a, b) => {
      const byArea = b.area - a.area;
      return byArea !== 0 ? byArea : a.id.localeCompare(b.id);
    });
  } else if (order === 'balanced') {
    // Give arrangeBalanced a stable base (area desc with id tie-breaker)
    const base = [...itemsById].sort((a, b) => {
      const byArea = b.area - a.area;
      return byArea !== 0 ? byArea : a.id.localeCompare(b.id);
    });
    ordered = arrangeBalanced(base, t => t.area);
  } else if (order === 'given') {
    // Keep neighbor order but make it deterministic downstream via anchoring (below).
    ordered = itemsGiven;
  }

  // --- Absolute orientation anchor: rotate array so the smallest id is at index 0.
  // This preserves neighbor order (circular shift) but prevents whole-ring spinning between runs.
  if (ordered.length > 0) {
    let anchorIdx = 0;
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].id.localeCompare(ordered[anchorIdx].id) < 0) anchorIdx = i;
    }
    if (anchorIdx !== 0) {
      ordered = [...ordered.slice(anchorIdx), ...ordered.slice(0, anchorIdx)];
    }
    if (debug) log('anchor', { anchorId: ordered[0].id });
  }

  const computeR0Global = () => {
    const rootR = circRadiusOfRect(rootInfl.w, rootInfl.h);

    let pairR = 0;
    for (let i = 0; i < ordered.length; i++) {
      const a = ordered[i].safeR;
      const b = ordered[(i + 1) % ordered.length].safeR;
      pairR = Math.max(pairR, (a + b) / 2);
    }

    // If N<2: trivial
    if (ordered.length < 2) {
      const R0 = Math.max(rootR, pairR);
      return { rootR, pairR, sumR: R0, chosenR0: R0, raised: false, sumAtPairR: 0 };
    }

    // Function: sum of required circle angles at radius R (monotonically decreases with R)
    const sumAnglesAt = (R: number) => {
      let s = 0;
      for (let i = 0; i < ordered.length; i++) {
        const a = ordered[i].safeR;
        const b = ordered[(i + 1) % ordered.length].safeR;
        const x = Math.min(1, Math.max(0, (a + b) / (2 * R)));
        s += 2 * Math.asin(x);
      }
      return s;
    };

    // Start at lower bound
    const R = Math.max(rootR, pairR);
    const sumAtPair = sumAnglesAt(R);

    // If already feasible on circle, we are done
    if (sumAtPair <= TAU + 1e-9) {
      const chosen = R;
      return { rootR, pairR, sumR: R, chosenR0: chosen, raised: false, sumAtPairR: sumAtPair };
    }

    // Else increase R until feasible, then binary search
    let lo = R;
    let hi = R;
    for (let k = 0; k < 40 && sumAnglesAt(hi) > TAU; k++) hi *= 1.1; // expand
    for (let k = 0; k < 60 && hi - lo > 1e-6; k++) {
      const mid = 0.5 * (lo + hi);
      if (sumAnglesAt(mid) > TAU) lo = mid;
      else hi = mid;
    }
    const sumR = hi;
    const chosen = sumR; // must satisfy global angle sum
    return { rootR, pairR, sumR, chosenR0: chosen, raised: true, sumAtPairR: sumAtPair };
  };

  const r0info = computeR0Global();
  const R0 = r0info.chosenR0;
  emit({
    type: 'r0',
    rootR: r0info.rootR,
    pairR: r0info.pairR,
    sumR: r0info.sumR,
    chosenR0: R0,
    raised: r0info.raised,
    sumAtPairR: r0info.sumAtPairR,
  });
  if (debug && r0info.raised) {
    log('R0 raised for global feasibility', {
      rootR: +r0info.rootR.toFixed(3),
      pairR: +r0info.pairR.toFixed(3),
      sumR: +r0info.sumR.toFixed(3),
      chosenR0: +R0.toFixed(3),
      sumAtPairR: +r0info.sumAtPairR.toFixed(3),
    });
  }
  onAutoRadius?.(R0);

  // --- Ellipse (auto from container aspect unless provided)
  let rx = ellipse?.rx;
  let ry = ellipse?.ry;
  if (!rx || !ry) {
    if (matchContainerAspect) {
      const ar = CW / CH;
      rx = Math.max(R0, ar >= 1 ? R0 * ar : R0);
      ry = Math.max(R0, ar >= 1 ? R0 : R0 / ar);
    } else {
      rx = ry = R0;
    }
    onAutoEllipse?.(rx, ry);
  }

  // Equivalent radius of ellipse at angle θ
  const Req = (theta: number) => 1 / Math.sqrt(Math.cos(theta) ** 2 / rx! ** 2 + Math.sin(theta) ** 2 / ry! ** 2);

  const N = ordered.length;

  // --- Seed angles
  const seedAngles = (): number[] => {
    if (N === 0) return [];
    if (N === 1) return [startAngle];
    if (N === 2) return [startAngle, clockwise ? startAngle + Math.PI : startAngle - Math.PI];

    // Base required angles on the **circle at R0** (lower bound)
    const baseAngles: number[] = [];
    let sumBase = 0;
    for (let i = 0; i < N; i++) {
      const a = ordered[i].safeR;
      const b = ordered[(i + 1) % N].safeR;
      const delta = 2 * Math.asin(Math.min(1, (a + b) / (2 * R0)));
      baseAngles.push(delta);
      sumBase += delta;
    }
    if (sumBase > TAU + 1e-9) {
      const k = TAU / sumBase;
      for (let i = 0; i < baseAngles.length; i++) baseAngles[i] *= k;
      sumBase = TAU;
    }
    const slackTotal = Math.max(0, TAU - sumBase);

    const theta: number[] = [];
    let th = startAngle;
    const addEach = slackTotal / N;
    for (let i = 0; i < N; i++) {
      theta.push(th);
      const step = baseAngles[i] + addEach;
      th += clockwise ? step : -step;
    }
    return theta;
  };

  const angNorm = (a: number) => {
    let x = a % TAU;
    if (x < 0) x += TAU;
    return x;
  };
  const angDist = (a: number, b: number) => {
    const u = angNorm(a),
      v = angNorm(b);
    let d = Math.abs(u - v);
    if (d > Math.PI) d = TAU - d;
    return d;
  };

  // Gap helpers
  const gapAt = (theta: number[], i: number) => {
    const j = (i + 1) % N;
    const a = theta[i];
    const b = j === 0 ? theta[0] + (clockwise ? TAU : -TAU) : theta[j];
    return clockwise ? b - a : a - b;
  };

  // Required gap for pair (i, i+1) at scale s (ellipse + circle lower bound at R0)
  const reqGapAt = (theta: number[], i: number, s: number) => {
    const j = (i + 1) % N;
    const a = theta[i];
    const b = j === 0 ? theta[0] + (clockwise ? TAU : -TAU) : theta[j];
    const mid = (a + b) * 0.5;
    const rEq = Req(mid) * s;
    const needEllipse = 2 * Math.asin(Math.min(1, (ordered[i].safeR + ordered[j].safeR) / (2 * rEq)));
    const needCircle = 2 * Math.asin(Math.min(1, (ordered[i].safeR + ordered[j].safeR) / (2 * R0)));
    return Math.max(needCircle, needEllipse);
  };

  // Diagnostics for gaps/requirements/slack + tight blocks
  const diagnoseGaps = (theta: number[], s: number) => {
    const gapsArr = new Array(N).fill(0).map((_, i) => gapAt(theta, i));
    const reqArr = new Array(N).fill(0).map((_, i) => reqGapAt(theta, i, s));
    const slackArr = gapsArr.map((g, i) => g - reqArr[i]);

    const THR = 1e-3;
    const tight = slackArr.map(v => v <= THR);
    const blocks: Array<{ leftEdge: number; rightEdge: number; size: number; sLeft: number; sRight: number }> = [];

    let i = 0;
    while (i < N) {
      if (!tight[i]) {
        i++;
        continue;
      }
      let j = i;
      while (tight[(j + 1) % N] && (j + 1) % N !== i) {
        j = (j + 1) % N;
      }
      const leftEdge = (i - 1 + N) % N;
      const rightEdge = (j + 1) % N;
      const size = j >= i ? j - i + 1 : N - i + j + 1;
      const sLeft = Math.max(0, gapsArr[leftEdge] - reqArr[leftEdge]);
      const sRight = Math.max(0, gapsArr[rightEdge] - reqArr[rightEdge]);
      blocks.push({ leftEdge, rightEdge, size, sLeft, sRight });
      i = (j + 1) % N;
      if (i === 0) break;
    }

    return { gaps: gapsArr, req: reqArr, slackArr, blocks };
  };

  // Compute bias weights for distributing slack across gaps
  const computeBiasWeights = (theta: number[], gapsReq: number[]) => {
    const w = new Array(N).fill(1 / N);
    if (!angleBias || N < 3) return w;

    let center = 0;
    const halfWidth = angleBias.halfWidth ?? Math.PI / 6;
    const strength = Math.max(0, angleBias.strength ?? 2);

    const mids = new Array(N).fill(0).map((_, i) => {
      const j = (i + 1) % N;
      const a = theta[i];
      const b = j === 0 ? theta[0] + (clockwise ? TAU : -TAU) : theta[j];
      return (a + b) * 0.5;
    });

    if (angleBias.mode === 'sector') {
      center = angleBias.center;
    } else {
      const g0 = mids.map((_, i) => gapAt(theta, i));
      const reqNow = gapsReq;
      const slackArr = g0.map((gi, i) => gi - reqNow[i]);
      let maxIdx = 0;
      let maxVal = -Infinity;
      for (let i = 0; i < N; i++) {
        if (slackArr[i] > maxVal) {
          maxVal = slackArr[i];
          maxIdx = i;
        }
      }
      center = mids[maxIdx];
      log('autoMaxSlack center @midAngle', { index: maxIdx, center });
    }

    const COS = (d: number, hw: number) => {
      if (d >= hw) return 0;
      return 0.5 * (1 + Math.cos((Math.PI * d) / hw));
    };

    let sum = 0;
    for (let i = 0; i < N; i++) {
      const d = angDist(mids[i], center);
      const win = COS(d, halfWidth);
      w[i] = 1 / N + strength * win;
      sum += w[i];
    }
    for (let i = 0; i < N; i++) {
      w[i] /= sum;
    }

    if (debug) {
      log('biasWeights', {
        mode: angleBias.mode,
        center,
        halfWidth,
        weights: w.map(v => +v.toFixed(4)),
        gapMidAngles: mids.map(v => +angNorm(v).toFixed(4)),
      });
    }
    return w;
  };

  // Feasibility-driven angles for a given scale s (returns null if Σ req > 2π).
  const computeFeasibleAngles = (s: number, prevTheta?: number[]) => {
    if (N === 0) return [];
    if (N === 1) return [startAngle];
    if (N === 2) return [startAngle, clockwise ? startAngle + Math.PI : startAngle - Math.PI];

    let theta = prevTheta && prevTheta.length === N ? [...prevTheta] : seedAngles();
    const MAX_PASS = 8;

    for (let pass = 0; pass < MAX_PASS; pass++) {
      // Ensure monotone
      for (let k = 1; k < N; k++) {
        if (clockwise) {
          if (theta[k] <= theta[k - 1]) theta[k] = theta[k - 1] + EPS;
        } else {
          if (theta[k] >= theta[k - 1]) theta[k] = theta[k - 1] - EPS;
        }
      }

      // Requirements on current mids
      const req: number[] = new Array(N);
      let sumReq = 0;
      for (let i = 0; i < N; i++) {
        req[i] = reqGapAt(theta, i, s);
        sumReq += req[i];
      }
      if (sumReq > TAU + 1e-9) return null;

      // Distribute slack by bias weights, then water-fill
      const slack = TAU - sumReq;
      const weights = computeBiasWeights(theta, req);
      const gapsOut = new Array(N).fill(0).map((_, i) => req[i] + slack * weights[i]);

      const slackArr = gapsOut.map((g, i) => g - req[i]);
      const meanSlack = slackArr.reduce((a, b) => a + b, 0) / N;
      const EXCESS = 1.6;

      const redistribute = (passes: number) => {
        for (let p = 0; p < passes; p++) {
          let rescued = 0;
          for (let i = 0; i < N; i++) {
            const si = gapsOut[i] - req[i];
            if (si > EXCESS * meanSlack) {
              const shave = Math.min(si - EXCESS * meanSlack, Math.max(meanSlack * 0.25, 0.02));
              gapsOut[i] -= shave;
              rescued += shave;
            }
          }
          if (rescued > 0) {
            for (let i = 0; i < N; i++) {
              gapsOut[i] += rescued * weights[i];
            }
          } else {
            break;
          }
        }
      };
      redistribute(2);

      // Rebuild theta
      const next: number[] = new Array(N);
      next[0] = startAngle;
      for (let i = 0; i < N - 1; i++) {
        next[i + 1] = clockwise ? next[i] + gapsOut[i] : next[i] - gapsOut[i];
      }

      // Convergence check
      let delta = 0;
      for (let i = 0; i < N; i++) {
        delta += Math.abs(next[i] - theta[i]);
      }
      theta = next;

      if (debug) {
        const gNow = new Array(N).fill(0).map((_, i) => gapAt(theta, i));
        log('angles pass', {
          pass,
          sumReq: +sumReq.toFixed(6),
          slack: +slack.toFixed(6),
          gaps: gNow.map(v => +v.toFixed(4)),
          req: req.map(v => +v.toFixed(4)),
        });
      }

      if (delta < 1e-4) break;
    }

    return theta;
  };

  // Place centers
  const placeCenters = (theta: number[], s: number): Record<string, RectTL> => {
    const pos: Record<string, RectTL> = {};
    pos['root'] = { x: CX, y: CY, w: root.packW, h: root.packH };
    for (let i = 0; i < N; i++) {
      const x = CX + rx! * s * Math.cos(theta[i]);
      const y = CY + ry! * s * Math.sin(theta[i]);
      const o = ordered[i];
      pos[o.id] = { x, y, w: o.baseW, h: o.baseH };
    }
    return pos;
  };

  type Blocker =
    | { type: 'rect-rect'; a: string; b: string }
    | { type: 'root'; a: string }
    | { type: 'container'; a: string };

  const checkCollisions = (theta: number[], s: number, respectRoot: boolean, respectContainer: boolean) => {
    const pos = placeCenters(theta, s);
    const rects = ordered.map(o => {
      const p = pos[o.id];
      const eff = inflateWH(p.w, p.h, gap);
      return { id: o.id, tl: rectCtoTL({ x: p.x, y: p.y, w: eff.w, h: eff.h }) };
    });

    const blockers: Blocker[] = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (intersects(rects[i].tl, rects[j].tl)) {
          blockers.push({ type: 'rect-rect', a: rects[i].id, b: rects[j].id });
        }
      }
    }
    if (respectRoot) {
      for (const r of rects) {
        if (intersects(r.tl, rootVoidTL)) {
          blockers.push({ type: 'root', a: r.id });
        }
      }
    }
    if (respectContainer) {
      for (const r of rects) {
        if (outsideContainer(r.tl, CW, CH)) {
          blockers.push({ type: 'container', a: r.id });
        }
      }
    }
    return { collided: blockers.length > 0, blockers, pos };
  };

  const doShrinkToTouch =
    typeof shrinkToTouch === 'boolean'
      ? { respectRoot: true, respectContainer: false, maxIters: 40, tol: 1e-4, minScale: 1e-3 }
      : (shrinkToTouch ?? {});

  // ---------- Tight-block shift ----------
  const tightBlockShift = (theta: number[], s: number) => {
    if (N < 3) return { theta, changed: false };
    const diag = diagnoseGaps(theta, s);
    emit({ type: 'tight-blocks', blocks: diag.blocks });
    if (!diag.blocks.length) return { theta, changed: false };

    const req = diag.req.slice();
    const g = diag.gaps.slice();

    const SHIFT_FACTOR = 0.8;
    let changed = false;

    for (const b of diag.blocks) {
      const L = b.leftEdge;
      const R = b.rightEdge;
      const sL = Math.max(0, g[L] - req[L]);
      const sR = Math.max(0, g[R] - req[R]);
      if (sL < 1e-6 && sR < 1e-6) {
        continue;
      }

      const rawDelta = (sL - sR) * 0.5;
      let delta = Math.abs(rawDelta) * SHIFT_FACTOR;
      if (rawDelta > 0) {
        delta = Math.min(delta, sL);
      } else {
        delta = Math.min(delta, sR);
      }
      if (delta <= 0) continue;

      let scale = 1.0;
      let applied = false;
      for (let tries = 0; tries < 3; tries++) {
        const g2 = g.slice();
        if (rawDelta > 0) {
          g2[L] = g[L] - delta * scale;
          g2[R] = g[R] + delta * scale;
        } else {
          g2[R] = g[R] - delta * scale;
          g2[L] = g[L] + delta * scale;
        }

        const theta2: number[] = new Array(N);
        theta2[0] = startAngle;
        for (let k = 0; k < N - 1; k++) {
          theta2[k + 1] = clockwise ? theta2[k] + g2[k] : theta2[k] - g2[k];
        }

        let ok = true;
        for (let k = 0; k < N; k++)
          if (g2[k] + 1e-9 < req[k]) {
            ok = false;
            break;
          }
        if (!ok) {
          scale *= 0.5;
          continue;
        }

        const { collided } = checkCollisions(theta2, s, true, false);
        if (collided) {
          scale *= 0.5;
          continue;
        }

        for (let k = 0; k < N; k++) {
          g[k] = g2[k];
        }
        for (let k = 0; k < N; k++) {
          theta[k] = theta2[k];
        }
        applied = true;
        changed = true;

        const detail = {
          leftEdge: L,
          rightEdge: R,
          moveDir: rawDelta > 0 ? 'left' : 'right',
          delta: +(delta * scale).toFixed(4),
          sLeft_before: +sL.toFixed(4),
          sRight_before: +sR.toFixed(4),
        };
        emit({ type: 'tight-shift', detail });
        log('tightShift block', detail);
        break;
      }
      if (!applied && debug) {
        log('tightShift skip (blocked)', { leftEdge: L, rightEdge: R, sLeft: sL, sRight: sR });
      }
    }

    if (changed && debug) {
      const diag2 = diagnoseGaps(theta, s);
      log('tightShift result', {
        gaps: diag2.gaps.map(v => +v.toFixed(4)),
        req: diag2.req.map(v => +v.toFixed(4)),
        slack: diag2.slackArr.map(v => +v.toFixed(4)),
      });
    }

    return { theta, changed };
  };
  // ---------- END tight-block shift ----------

  // --- Main shrink with feasibility-driven angles on every probe
  const shrinkSearch = (thetaGuess?: number[]) => {
    let bestTheta: number[] = thetaGuess && thetaGuess.length === N ? [...thetaGuess] : seedAngles();
    let finalScale = 1;

    if (N >= 1) {
      const respectRoot = doShrinkToTouch.respectRoot ?? true;
      const respectContainer = doShrinkToTouch.respectContainer ?? false;
      const maxIters = doShrinkToTouch.maxIters ?? 40;
      const tol = doShrinkToTouch.tol ?? 1e-4;
      const minScale = doShrinkToTouch.minScale ?? 1e-3;

      const ensureHiSafe = (s: number) => {
        let hi = s;
        for (let k = 0; k < 12; k++) {
          // a bit more generous after R0 fix
          const th = computeFeasibleAngles(hi, bestTheta);
          if (!th) {
            hi *= 1.1;
            continue;
          }
          const { collided } = checkCollisions(th, hi, respectRoot, respectContainer);
          if (collided) {
            hi *= 1.1;
            continue;
          }
          return { hi, th };
        }
        return { hi, th: bestTheta };
      };

      const res = ensureHiSafe(1);
      let hi = res.hi;
      const th = res.th;
      bestTheta = th;
      let lo = minScale;

      for (let it = 0; it < maxIters && hi - lo > tol; it++) {
        const mid = 0.5 * (lo + hi);
        const thetaMid = computeFeasibleAngles(mid, bestTheta);
        if (!thetaMid) {
          lo = mid;
          if (debug) {
            log('shrink probe infeasible (sumReq>TAU)', { mid });
          }
          continue;
        }

        const d = diagnoseGaps(thetaMid, mid);
        emit({
          type: 'probe',
          mid,
          sumReq: d.req.reduce((a, b) => a + b, 0),
          slack: TAU - d.req.reduce((a, b) => a + b, 0),
          gaps: d.gaps,
          req: d.req,
          slackArr: d.slackArr,
        });

        const { collided, blockers } = checkCollisions(thetaMid, mid, respectRoot, respectContainer);
        if (collided) {
          lo = mid;
          if (debug) {
            log('collision @mid', { mid, blockers });
          }
        } else {
          hi = mid;
          bestTheta = thetaMid;
        }
      }

      finalScale = hi;
    }

    return { bestTheta, finalScale };
  };

  // First shrink
  let { bestTheta, finalScale } = shrinkSearch();

  // --- Re-shrink loop with tight-block shift ---
  const MAX_ROUNDS = 3;
  const IMPROVE_THR = 1e-4;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const before = finalScale;
    const { theta: thetaShifted, changed } = tightBlockShift(bestTheta, finalScale);
    if (!changed) break;

    const res = shrinkSearch(thetaShifted);
    bestTheta = res.bestTheta;
    finalScale = res.finalScale;

    if (debug)
      log('re-shrink round', {
        round,
        scaleBefore: +before.toFixed(6),
        scaleAfter: +finalScale.toFixed(6),
      });
    if (before - finalScale < IMPROVE_THR) break;
  }

  // Snap final angles to mitigate binary float drift (keeps layout reproducible)
  bestTheta = bestTheta.map(v => snap(v, 12));

  // --- Bottleneck diagnostics at final angles ---
  const estimateAngleBound = (theta: number[]) => {
    let lo = 1e-4;
    let hi = 1.0;
    for (let it = 0; it < 32; it++) {
      const mid = 0.5 * (lo + hi);
      let sumReq = 0;
      for (let i = 0; i < N; i++) {
        sumReq += reqGapAt(theta, i, mid);
      }
      if (sumReq > TAU) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const s = hi;
    const gapsArr = new Array(N).fill(0).map((_, i) => gapAt(theta, i));
    const reqArr = new Array(N).fill(0).map((_, i) => reqGapAt(theta, i, s));
    let minSlack = Infinity;
    const idx: number[] = [];
    for (let i = 0; i < N; i++) {
      const sl = gapsArr[i] - reqArr[i];
      if (sl < minSlack - 1e-6) {
        minSlack = sl;
        idx.length = 0;
        idx.push(i);
      } else if (Math.abs(sl - minSlack) <= 1e-6) {
        idx.push(i);
      }
    }
    return { s, limitEdges: idx };
  };

  const estimateCollisionBound = (theta: number[]) => {
    let lo = 1e-4;
    let hi = 1.0;
    const safe = (s: number) => !checkCollisions(theta, s, true, false).collided;
    while (!safe(hi)) {
      hi *= 1.1;
    }
    for (let it = 0; it < 32; it++) {
      const mid = 0.5 * (lo + hi);
      if (safe(mid)) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    const { blockers } = checkCollisions(theta, hi, true, false);
    return { s: hi, blockers };
  };

  const angB = estimateAngleBound(bestTheta);
  const colB = estimateCollisionBound(bestTheta);
  emit({ type: 'bottlenecks', angleBound: angB, collisionBound: colB });

  // Final placement
  const positions = placeCenters(bestTheta, finalScale);

  // Logs: inputs and summary
  if (debug) {
    log('input summary', {
      container: { w: CW, h: CH },
      root: { packW: root.packW, packH: root.packH, gap, rootPadding },
      ordered: ordered.map(o => ({
        id: o.id,
        w: o.baseW,
        h: o.baseH,
        safeR: +o.safeR.toFixed(2),
      })),
      R0: +R0.toFixed(3),
      rx: +rx!.toFixed(3),
      ry: +ry!.toFixed(3),
      finalScale: +finalScale.toFixed(6),
    });

    const finalCheck = checkCollisions(bestTheta, finalScale, true, false);
    if (finalCheck.collided) {
      log('final blockers', finalCheck.blockers);
    }
  }
  emit({ type: 'summary', R0, rx: rx!, ry: ry!, finalScale });

  // Extent & metrics
  const allRects: RectTL[] = Object.values(positions);
  let xMin = Number.POSITIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (const rc of allRects) {
    const tl = rectCtoTL(rc);
    xMin = Math.min(xMin, tl.x);
    yMin = Math.min(yMin, tl.y);
    xMax = Math.max(xMax, tl.x + tl.w);
    yMax = Math.max(yMax, tl.y + tl.h);
  }

  const usedArea = ordered.reduce((s, o) => s + o.baseW * o.baseH, 0);
  const effectiveArea = Math.PI * rx! * ry!;
  const rootInflArea = rootInfl.w * rootInfl.h;

  const dists = ordered.map(o => {
    const p = positions[o.id];
    const dx = p.x - CX;
    const dy = p.y - CY;
    return Math.sqrt(dx * dx + dy * dy);
  });

  return {
    positions,
    extent: { xMin, yMin, xMax, yMax },
    metrics: {
      totalOverlap: 0,
      totalWhitespace: Math.max(0, effectiveArea - usedArea - rootInflArea),
      overflowAmount: {
        left: Math.max(0, -xMin),
        right: Math.max(0, xMax - CW),
        top: Math.max(0, -yMin),
        bottom: Math.max(0, yMax - CH),
      },
      centrality: {
        mean: dists.length ? dists.reduce((s, v) => s + v, 0) / dists.length : 0,
        p95: dists.length ? dists[Math.floor(0.95 * (dists.length - 1))] : 0,
      },
      placementsWithOverflow: 0,
    },
  };
}
