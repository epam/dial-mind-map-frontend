import { Core } from 'cytoscape';

import { setContainerVisibility } from '../../../setContainerVisibility';
import { ClusteredLayoutConfig, DEFAULT_LAYOUT_CONFIG } from '../types/config';
import { Cluster, Container, Gaps, Pos, RootSizes } from '../types/shared';
import { computeBBox, getContainer, nodeSize, nodeSizeWithLabels } from '../utils/cytoscape';
import { applyFinalCenterPull } from './centerPull';
import { layoutClustersElliptic, LayoutResult as LLayoutResult } from './ellipticRingLayout';
import { buildHierarchy } from './hierarchy';
import {
  orientManyChildrenRadialOutwardIterative,
  placeKidsCircleLocal,
  placeKidsGrid4Local,
  placeKidsOnArcLocal,
  placeSingleChildLocal,
  placeSingleChildRadialOutwardIterative,
  placeThreeChildrenRadialOutwardIterative,
  placeTwoChildrenRadialOutwardIterative,
  spanByCount,
} from './localPlacement';
import { computeNodeLevelShrinkScale } from './nodeShrink';

/**
 * Main orchestration:
 *  1) Build clusters (root + level-1 parents + their children).
 *  2) Compute local layouts per cluster (keep parent at local origin).
 *  3) Elliptic packing to place cluster centers around the root.
 *  4) Optional node-level “shrink to touch” across clusters.
 *  5) Apply 'preset' layout to Cytoscape.
 */
export function applyClusteredAroundRoot(
  cy: Core,
  overrides: Partial<ClusteredLayoutConfig> = {},
  initialGraph = false,
): void {
  const cfg: ClusteredLayoutConfig = { ...DEFAULT_LAYOUT_CONFIG, ...overrides };
  const { width, height, center } = getContainer(cy);

  const rootId = cy
    .nodes()
    .filter(n => n.hasClass('focused'))
    .id();
  const previousNodeId = cy
    .nodes()
    .filter(n => n.hasClass('previous'))
    .id();

  const { childrenByParent, levelOne } = buildHierarchy(
    cy,
    rootId,
    previousNodeId !== rootId ? previousNodeId : undefined,
  );

  // 1) Local (intra-cluster) layout
  const clustersLocal: Record<
    string,
    {
      localPos: Record<string, Pos>;
      innerBBox: { w: number; h: number; cx: number; cy: number };
      outerRect: { w: number; h: number };
    }
  > = {};

  function layoutClusterLocally(
    parentId: string,
    childIds: string[],
  ): {
    localPos: Record<string, Pos>;
    innerBBox: { w: number; h: number; cx: number; cy: number };
    outerRect: { w: number; h: number };
  } {
    const localPos: Record<string, Pos> = {};
    localPos[parentId] = { x: 0, y: 0 };

    if (childIds.length === 0) {
      const bbox = computeBBox(cy, [parentId], localPos, nodeSize, cfg);
      return {
        localPos,
        innerBBox: { w: bbox.w, h: bbox.h, cx: bbox.cx, cy: bbox.cy },
        outerRect: { w: bbox.w + 2 * cfg.CLUSTER_PAD, h: bbox.h + 2 * cfg.CLUSTER_PAD },
      };
    }
    const span = Math.max(spanByCount(childIds.length, cfg), cfg.EMPTY_MIN_DEG);

    switch (childIds.length) {
      case 1:
        placeSingleChildLocal(cy, parentId, childIds[0], cfg, localPos);
        break;
      case 2:
      case 3:
        placeKidsOnArcLocal(cy, parentId, 0, span, childIds, cfg, localPos);
        break;
      case 4:
        placeKidsGrid4Local(cy, parentId, childIds, cfg, localPos);
        break;
      default:
        placeKidsCircleLocal(cy, parentId, childIds, cfg, localPos);
        break;
    }

    const ids = [parentId, ...childIds];
    const bbox = computeBBox(cy, ids, localPos, nodeSize, cfg);
    return {
      localPos,
      innerBBox: { w: bbox.w, h: bbox.h, cx: bbox.cx, cy: bbox.cy },
      outerRect: { w: bbox.w + 2 * cfg.CLUSTER_PAD, h: bbox.h + 2 * cfg.CLUSTER_PAD },
    };
  }

  for (const pid of levelOne) {
    const kids = childrenByParent[pid] || [];
    clustersLocal[pid] = layoutClusterLocally(pid, kids);
  }
  const rootLocal = layoutClusterLocally(rootId, []);

  // 2) Inputs for ring layout
  const container: Container = { w: width, h: height };

  const rootBBWithLabels = computeBBox(cy, [rootId], { [rootId]: { x: 0, y: 0 } }, nodeSizeWithLabels, cfg);
  const rootSizes: RootSizes = {
    innerW: rootLocal.innerBBox.w,
    innerH: rootLocal.innerBBox.h,
    outerW: rootLocal.outerRect.w,
    outerH: rootLocal.outerRect.h,
    packW: rootBBWithLabels.w + 2 * cfg.CLUSTER_PAD,
    packH: rootBBWithLabels.h + 2 * cfg.CLUSTER_PAD,
  };

  const clustersForPacking: Cluster[] = levelOne.map<Cluster>(pid => {
    const kids = childrenByParent[pid] || [];
    const local = clustersLocal[pid];
    const ids = [pid, ...kids];
    const bbWithLabels = computeBBox(cy, ids, local.localPos, nodeSizeWithLabels, cfg);
    const packW = bbWithLabels.w + 2 * cfg.CLUSTER_PAD;
    const packH = bbWithLabels.h + 2 * cfg.CLUSTER_PAD;
    return {
      id: pid,
      kids: kids.length,
      innerW: local.innerBBox.w,
      innerH: local.innerBBox.h,
      outerW: local.outerRect.w,
      outerH: local.outerRect.h,
      packW,
      packH,
      area: packW * packH,
      AR: packW / Math.max(1, packH),
    };
  });

  const gaps: Gaps = { betweenClusters: cfg.GAP, border: cfg.LAYOUT_PADDING };

  const packed: LLayoutResult = layoutClustersElliptic(container, rootSizes, clustersForPacking, gaps, {
    startAngle: -Math.PI / 2,
    clockwise: true,
    order: 'given',
    rootPadding: 8,
    matchContainerAspect: true,
    shrinkToTouch: true,
    debug: cfg.DEBUG_LOG,
    angleBias: { mode: 'autoMaxSlack', halfWidth: Math.PI / 5, strength: 2.0 },
  });

  // Center packed layout to actual container center (numerical guard).
  const dx = center.x - packed.positions['root'].x;
  const dy = center.y - packed.positions['root'].y;
  for (const k of Object.keys(packed.positions)) {
    packed.positions[k].x += dx;
    packed.positions[k].y += dy;
  }

  // Fine-tune clusters with 1 or 2 kids: push outward along the ray for compactness.
  for (const pid of levelOne) {
    const kids = childrenByParent[pid] || [];
    const pc = packed.positions[pid];
    if (!pc) continue;

    switch (kids.length) {
      case 1:
        placeSingleChildRadialOutwardIterative(cy, pid, kids[0], clustersLocal[pid], center.x, center.y, pc, cfg);
        break;
      case 2:
        placeTwoChildrenRadialOutwardIterative(cy, pid, kids, clustersLocal[pid], center.x, center.y, pc, cfg);
        break;
      case 3:
        placeThreeChildrenRadialOutwardIterative(cy, pid, kids, clustersLocal[pid], center.x, center.y, pc, cfg);
        break;
      default:
        orientManyChildrenRadialOutwardIterative(cy, pid, kids, clustersLocal[pid], center.x, center.y, pc, cfg);
        break;
    }
  }

  // 4) Node-level shrink-to-touch (labels included across clusters)
  const finalScale = computeNodeLevelShrinkScale({
    cy,
    levelOne,
    clustersLocal,
    packedPositions: Object.fromEntries(Object.entries(packed.positions).map(([id, p]) => [id, { x: p.x, y: p.y }])),
    rootSizes: { packW: rootSizes.packW, packH: rootSizes.packH },
    gaps,
    center,
    width,
    height,
    cfg,
  });

  for (const pid of levelOne) {
    const pc = packed.positions[pid];
    pc.x = center.x + (pc.x - center.x) * finalScale;
    pc.y = center.y + (pc.y - center.y) * finalScale;
  }

  // 5) Build final node positions
  let finalPositions: Record<string, { x: number; y: number }> = {};
  finalPositions[rootId] = { x: packed.positions['root'].x, y: packed.positions['root'].y };

  for (const pid of levelOne) {
    const kids = childrenByParent[pid] || [];
    const local = clustersLocal[pid];
    const pc = packed.positions[pid];
    if (!pc) continue;

    const shiftX = pc.x - local.innerBBox.cx;
    const shiftY = pc.y - local.innerBBox.cy;

    finalPositions[pid] = { x: shiftX, y: shiftY };
    for (const cid of kids) {
      const lp = local.localPos[cid];
      finalPositions[cid] = { x: lp.x + shiftX, y: lp.y + shiftY };
    }
  }

  finalPositions = applyFinalCenterPull(cy, finalPositions, {
    levelOne,
    childrenByParent,
    packedRects: packed.positions,
    rootId,
    cfg,
  });

  if (initialGraph) {
    const rootPos = finalPositions[rootId];
    requestAnimationFrame(() => setContainerVisibility(cy, true));

    // 1) Instantly place ALL nodes at the root position (no animation).
    //    This sets a clear starting point for the subsequent animated preset layout.
    cy.batch(() => {
      cy.nodes().positions(() => ({ x: rootPos.x, y: rootPos.y }));
    });

    // 2) Animate to the computed final positions.
    //    Important: we force animate=true for the first run to achieve the "fly-in".
    const layout = cy.layout({
      name: 'preset',
      positions: finalPositions,
      animate: true, // force animation on initial fly-in
      animationDuration: cfg.LAYOUT_ANIMATE_MS,
      fit: true, // fit at the end of the animation so the final state is nicely framed
      padding: cfg.LAYOUT_PADDING,
    });

    layout.run();
  } else {
    const layout = cy.layout({
      name: 'preset',
      positions: finalPositions,
      animate: cfg.ANIMATE,
      animationDuration: cfg.LAYOUT_ANIMATE_MS,
      fit: true,
      padding: cfg.LAYOUT_PADDING,
    });

    layout.run();
  }
}
