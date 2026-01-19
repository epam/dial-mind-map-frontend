import omit from 'lodash-es/omit';

import { Edge, EdgeType, GraphElement, PositionedElement } from '@/types/graph';
import { isEdge, isNode } from '@/utils/app/graph/typeGuards';

type EdgeEl = PositionedElement<GraphElement> & { data: Edge };

type MergeOptions = {
  /**
   * Compute a priority score for an edge. Higher is better.
   * Defaults: data.priority ?? data.weight ?? 0; ties break by earlier index.
   */
  getPriority?: (edge: Edge, originalIndex: number) => number;

  /**
   * If true, keep all additional parallel edges that share the same unordered pair (u,v)
   * as standalone edges (not merged). Default: false (exactly one merged edge per unordered pair).
   */
  keepAllParallelEdgesSamePair?: boolean;

  /** Enable console.debug logs for diagnostics. */
  debug?: boolean;
};

const edgeTypeRank: Partial<Record<EdgeType, number>> = {
  [EdgeType.Manual]: 3,
  [EdgeType.Init]: 2,
  [EdgeType.Generated]: 1,
};

const EDGE_TYPE_PRIORITY_WEIGHT = 1000;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultGetPriority: NonNullable<MergeOptions['getPriority']> = (e, i) => {
  const anyEdge = e as any;

  const typeScore = e.type ? (edgeTypeRank[e.type as EdgeType] ?? 0) : 0;

  const baseScore =
    (typeof anyEdge.priority === 'number' ? anyEdge.priority : 0) ||
    (typeof anyEdge.weight === 'number' ? anyEdge.weight : 0);

  return typeScore * EDGE_TYPE_PRIORITY_WEIGHT + baseScore;
};

/**
 * Merge opposite-direction edges (u->v) and (v->u) into a single edge element
 * where the chosen "primary" carries `reverseEdge` with sanitized data of the opposite one.
 *
 * Complexity: O(n). Nodes are preserved as-is.
 */
export function mergeBidirectionalEdges(
  elements: PositionedElement<GraphElement>[],
  opts: MergeOptions = {},
): PositionedElement<GraphElement>[] {
  const { getPriority = defaultGetPriority, keepAllParallelEdgesSamePair = false, debug = false } = opts;

  const nodes = elements.filter(el => isNode(el.data));
  const edges = elements.filter(el => isEdge(el.data)) as EdgeEl[];

  // Group by unordered pair key "a|b" where a<=b (string compare)
  type Rec = { el: EdgeEl; idx: number };
  type Group = { ab: Rec[]; ba: Rec[]; firstIdx: number };
  const groups = new Map<string, Group>();

  const toKey = (a: string, b: string) => {
    const A = String(a);
    const B = String(b);
    return A <= B ? `${A}|${B}` : `${B}|${A}`;
  };

  const dir = (a: string, b: string) => {
    const A = String(a);
    const B = String(b);
    // "ab" means direction is from min(A,B) -> max(A,B)
    return A <= B ? 'ab' : 'ba';
  };

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const { source, target } = edge.data;
    const key = toKey(String(source), String(target));
    const d = dir(String(source), String(target));

    let g = groups.get(key);
    if (!g) {
      g = { ab: [], ba: [], firstIdx: i };
      groups.set(key, g);
    }
    (g[d as 'ab' | 'ba'] as Rec[]).push({ el: edge, idx: i });
    g.firstIdx = Math.min(g.firstIdx, i);
  }

  const outEdges: Array<{ idx: number; el: EdgeEl }> = [];

  // Helper: pick best record by priority, tie-breaker by earlier index
  const pickBest = (recs: Rec[]): Rec | undefined => {
    if (recs.length === 0) return undefined;
    let best = recs[0];
    let bestScore = getPriority(recs[0].el.data, recs[0].idx);
    let bestIdx = recs[0].idx;

    for (let k = 1; k < recs.length; k++) {
      const score = getPriority(recs[k].el.data, recs[k].idx);
      if (score > bestScore || (score === bestScore && recs[k].idx < bestIdx)) {
        best = recs[k];
        bestScore = score;
        bestIdx = recs[k].idx;
      }
    }
    return best;
  };

  groups.forEach((g, key) => {
    const hasAB = g.ab.length > 0;
    const hasBA = g.ba.length > 0;

    if (hasAB && hasBA) {
      // There is at least one edge each way: create exactly ONE merged edge for this pair.
      const bestAB = pickBest(g.ab)!;
      const bestBA = pickBest(g.ba)!;

      const all = [bestAB, bestBA];
      const primary = all.reduce((p, c) => {
        const sp = getPriority(p.el.data, p.idx);
        const sc = getPriority(c.el.data, c.idx);
        if (sc > sp) return c;
        if (sc < sp) return p;
        return c.idx < p.idx ? c : p; // earlier wins
      });

      const reverse = primary === bestAB ? bestBA : bestAB;

      const merged: EdgeEl = {
        ...primary.el,
        data: {
          ...primary.el.data,
          // sanitize reverse to avoid nesting reverseEdge->reverseEdge...
          reverseEdge: omit(reverse.el.data, 'reverseEdge') as Edge,
        },
      };

      outEdges.push({ idx: g.firstIdx, el: merged });

      if (keepAllParallelEdgesSamePair) {
        // Keep the rest (excluding the two we used).
        const pushOthers = (recs: Rec[], used: Rec) => {
          for (const r of recs) {
            if (r === used) continue;
            outEdges.push({ idx: r.idx, el: r.el });
          }
        };
        pushOthers(g.ab, bestAB);
        pushOthers(g.ba, bestBA);
      }

      if (debug) {
        // eslint-disable-next-line no-console
        console.debug(
          '[mergeBidirectionalEdges] merged pair',
          key,
          'primaryId=',
          (primary.el.data as any).id,
          'reverseId=',
          (reverse.el.data as any).id,
        );
      }
    } else {
      // Only one direction exists: include all edges as-is
      for (const r of g.ab) outEdges.push({ idx: r.idx, el: r.el });
      for (const r of g.ba) outEdges.push({ idx: r.idx, el: r.el });
    }
  });

  // Keep edges in stable order relative to their first appearance
  outEdges.sort((a, b) => a.idx - b.idx);

  return [...nodes, ...outEdges.map(e => e.el)];
}
