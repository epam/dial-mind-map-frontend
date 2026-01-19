'use client';
import classNames from 'classnames';
import cytoscape, { Core, CoseLayoutOptions, EventObject, NodeSingular } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import cloneDeep from 'lodash-es/cloneDeep';
import debounce from 'lodash-es/debounce';
import isEqual from 'lodash-es/isEqual';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';
import { PlaybackSelectors } from '@/store/chat/playback/playback.selectors';
import { ChatUIActions, ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { GraphConfig, GraphImgResourceKey, GraphLayoutType, GraphNodeType } from '@/types/customization';
import { Element, GraphElement, Node, SystemNodeDataKeys } from '@/types/graph';

import { FitGraph } from '../FitGraph';
import { LevelSwitcher } from '../LevelSwitcher';
import { useDebouncedGraphUpdate } from './hooks/useDebouncedGraphUpdate';
import { useThrottledResizeGraph } from './hooks/useThrottledResizeGraph';
import {
  AnimationDurationMs,
  FitDurationMs,
  getCytoscapeStyles,
  getSecondLayoutOptions,
  GraphPadding,
  HoverDurationMs,
  InitLayoutOptions,
} from './options';
import { adjustMessages } from './utils/adjustMessages';
import { filterInvalidEdges } from './utils/graph/filterInvalidEdges';
import { applyClusteredAroundRoot, ClusteredLayoutConfig } from './utils/graph/layout/';
import { markParents } from './utils/graph/markParents';
import { sanitizeElements } from './utils/sanitizeElements';
import { setContainerVisibility } from './utils/setContainerVisibility';
import { adjustElementsStyles, adjustNeonedNodeStyles } from './utils/styles/adjustElementsStyles';
import { getHoverEffectStyles } from './utils/styles/getHoverEffectStyles';

cytoscape.use(fcose);

interface Props {
  elements: Element<GraphElement>[];
  focusNodeId: string;
  isReady: boolean;
  visitedNodes: Record<string, string>;
  updateSignal: number;
  isChatHidden: boolean;
  graphConfig: GraphConfig;
  fontFamily?: string;
  robotStorageIcon?: string;
  arrowBackStorageIcon?: string;
  onFocusNodeChange: (node: Node) => void;
  isProdEnv: boolean;
}

/**
 * InnerGraph: all heavy logic lives here.
 * Wrapper below will force a full remount when graphConfig.layout changes.
 */
const InnerGraph = ({
  elements,
  focusNodeId,
  visitedNodes,
  onFocusNodeChange,
  updateSignal,
  isReady,
  isChatHidden,
  graphConfig,
  fontFamily,
  robotStorageIcon,
  arrowBackStorageIcon,
  isProdEnv,
}: Props) => {
  cytoscape.warnings(!isProdEnv);

  const cyRef = useRef<HTMLDivElement>(null);

  const dispatch = useChatDispatch();

  const nodeClickHandler = useCallback(
    (event: EventObject) => {
      const node = event.target.data();
      onFocusNodeChange(cloneDeep(node));
    },
    [onFocusNodeChange],
  );

  const additionalLayoutApplied = useRef(false);
  const firstPaintDoneRef = useRef(false); // Show container only after the very first full layout+fit
  const [isInitialization, setIsInitialization] = useState(true);
  const [cy, setCy] = useState<Core | null>(null);
  const neonStartedRef = useRef(false);
  const hoveredNodeFontSizesRef = useRef<Map<string, number>>(new Map<string, number>());
  const clusteredFirstRunRef = useRef(false);

  const mindmapAppName = useChatSelector(ApplicationSelectors.selectAppName);
  const theme = useChatSelector(ChatUISelectors.selectThemeName);
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isDesktop = deviceType === DeviceType.Desktop;

  const isPlayback = useChatSelector(PlaybackSelectors.selectIsPlayback);

  const debouncedSetIsFitGraphAvailable = debounce(isFitGraphAvailable => {
    dispatch(ChatUIActions.setIsFitGraphAvailable(isFitGraphAvailable));
  }, 300);

  const cytoscapeStyles: cytoscape.StylesheetStyle[] = useMemo(
    () =>
      getCytoscapeStyles(mindmapAppName ?? '', theme, graphConfig, fontFamily, robotStorageIcon, arrowBackStorageIcon),
    [mindmapAppName, graphConfig, fontFamily, robotStorageIcon, arrowBackStorageIcon, theme],
  );

  const secondLayoutOptions = useMemo(
    () => getSecondLayoutOptions(graphConfig.cytoscapeLayoutSettings ?? undefined),
    [graphConfig.cytoscapeLayoutSettings],
  );

  useEffect(() => {
    if (updateSignal > 0) {
      setIsInitialization(false);
      hoveredNodeFontSizesRef.current = new Map<string, number>();
    }
  }, [updateSignal]);

  useEffect(() => {
    if (cyRef.current && isReady) {
      const previousNodeId = visitedNodes[focusNodeId];
      neonStartedRef.current = false;
      let subgraphElements = cloneDeep(elements);
      const { validElements, invalidEdges } = filterInvalidEdges(subgraphElements);
      if (invalidEdges.length > 0) {
        console.warn(
          `Attention: Invalid edges found in the graph structure: ${invalidEdges.map(e => e.data.id).join(', ')}.`,
        );
      }
      subgraphElements = validElements;
      subgraphElements = markParents(subgraphElements, focusNodeId);
      subgraphElements = sanitizeElements(subgraphElements, graphConfig.useNodeIconAsBgImage);

      const initOptions = { ...InitLayoutOptions };
      if (graphConfig.layout === GraphLayoutType.EllipticRing) {
        initOptions.animationDuration = 200;
      }

      const cy = cytoscape({
        container: cyRef.current,
        elements: subgraphElements,
        style: cytoscapeStyles,
        wheelSensitivity: 0.4,
        layout: {
          randomize: true,
          ...initOptions,
        } as CoseLayoutOptions,
      });

      clusteredFirstRunRef.current = false;

      if (graphConfig.layout === GraphLayoutType.EllipticRing) {
        setContainerVisibility(cy, false);
      }

      cy.on('tap', 'node', event => {
        const node = event.target as NodeSingular;
        if (node.hasClass('focused') || node.hasClass('notap') || isPlayback) {
          return;
        }

        node.data(SystemNodeDataKeys.NodeType, GraphNodeType.Root);
        nodeClickHandler(event);
        setIsInitialization(false);
        hoveredNodeFontSizesRef.current = new Map<string, number>();
      });

      cy.on('mouseover', 'node', event => {
        const node = event.target as NodeSingular;

        const container = cy.container();
        if (container) {
          container.style.cursor = 'pointer';
        }

        const styles = getHoverEffectStyles(node, graphConfig, 'mouseover');

        node.animate({ style: styles }, { duration: HoverDurationMs, queue: false });
      });

      cy.on('mouseout', 'node', event => {
        const node = event.target as NodeSingular;

        const container = cy.container();
        if (container) {
          container.style.cursor = 'default';
        }

        const styles = getHoverEffectStyles(node, graphConfig, 'mouseout');

        node.animate({ style: styles }, { duration: HoverDurationMs, queue: false });
      });

      cy.on('layoutstart', () => {
        dispatch(MindmapActions.setRelayoutInProgress(true));
        // Keep it invisible for the very first two-phase layout
        if (!firstPaintDoneRef.current && graphConfig.layout === GraphLayoutType.EllipticRing) {
          setContainerVisibility(cy, false);
        }
        cy.minZoom(0);
        cy.nodes().forEach(node => {
          node.addClass('notap');
        });
        cy.nodes('[?neon]').forEach(node => {
          node.data(SystemNodeDataKeys.Pulsating, false);
        });
      });

      cy.on('layoutstop', () => {
        if (!additionalLayoutApplied.current) {
          additionalLayoutApplied.current = true;

          const childNodes = cy.nodes().filter(ele => ele.isChild());
          const parentNodes = new Set<string>();

          // Detach child nodes from their parents
          childNodes.forEach(child => {
            const parent = child.parent().first();
            if (parent) {
              parentNodes.add(parent.id());
              child.move({ parent: null });
            }
          });

          // Remove parent nodes
          parentNodes.forEach((parentId: string) => {
            cy.getElementById(parentId).remove();
          });

          if (graphConfig.layout === GraphLayoutType.EllipticRing) {
            const animate = clusteredFirstRunRef.current ? true : false;
            const options: Partial<ClusteredLayoutConfig> = { ANIMATE: animate };
            if (animate) {
              options.LAYOUT_ANIMATE_MS = 500;
            }
            applyClusteredAroundRoot(cy, options, !animate);
            clusteredFirstRunRef.current = true;
            if (graphConfig.layout === GraphLayoutType.EllipticRing) {
              // Use RAF to ensure renderer finalized the fit before showing
              requestAnimationFrame(() => setContainerVisibility(cy, true));
            }
          } else {
            cy.layout(secondLayoutOptions).run();
          }
        } else {
          additionalLayoutApplied.current = false;
          cy.animate({
            fit: {
              eles: cy.elements(),
              padding: GraphPadding,
            },
            duration: FitDurationMs,
            queue: false,
            complete: () => {
              cy.minZoom(cy.zoom());

              let minWidth = Infinity;
              let minHeight = Infinity;

              cy.nodes().forEach(node => {
                if (node.data(SystemNodeDataKeys.Neon)) {
                  adjustNeonedNodeStyles(node);
                }
                node.removeClass('notap');

                const bb = node.boundingBox();
                if (bb.w < minWidth) minWidth = bb.w;
                if (bb.h < minHeight) minHeight = bb.h;
              });

              const viewportWidth = cy.width();
              const viewportHeight = cy.height();

              // Calculate zoom factor so the smallest node fits viewport
              const zoomX = viewportWidth / minWidth;
              const zoomY = viewportHeight / minHeight;
              const minZoom = Math.min(zoomX, zoomY);

              cy.maxZoom(minZoom / 2);

              // Reveal instantly (no animation) after the very first full layout+fit
              if (!firstPaintDoneRef.current) {
                if (graphConfig.layout === GraphLayoutType.EllipticRing) {
                  // Use RAF to ensure renderer finalized the fit before showing
                  requestAnimationFrame(() => setContainerVisibility(cy, true));
                }
                firstPaintDoneRef.current = true;
              }
              dispatch(MindmapActions.setRelayoutInProgress(false));
            },
          });

          cy.on('pan dragfree', () => {
            const extent = cy.extent();
            const bb = cy.elements().boundingBox();
            const isInside = bb.x1 >= extent.x1 && bb.y1 >= extent.y1 && bb.x2 <= extent.x2 && bb.y2 <= extent.y2;

            debouncedSetIsFitGraphAvailable(!isInside);
          });
        }
      });

      setCy(cy);

      const visitedNodesIds = Object.entries(visitedNodes).flatMap(([key, value]) => [key, value]);
      const nodeColorMap = adjustElementsStyles(
        cy,
        focusNodeId,
        visitedNodesIds,
        previousNodeId,
        graphConfig,
        fontFamily,
      );

      const focusNode = (elements.find(el => el.data.id === focusNodeId) ?? { data: { id: focusNodeId } }).data as Node;

      adjustMessages({
        cyInstance: cy,
        focusNode,
        dispatch,
        mindmapAppName: mindmapAppName ?? '',
        theme,
        nodeColorMap,
        previousNodeId,
        isInitialization: true,
        defaultBgImg: graphConfig.images?.[GraphImgResourceKey.DefaultBgImg],
      });

      return () => {
        cy.destroy();
      };
    }
  }, [isReady, isChatHidden, cytoscapeStyles, fontFamily, secondLayoutOptions]);

  useThrottledResizeGraph(cy, AnimationDurationMs, graphConfig.layout);

  useDebouncedGraphUpdate({
    cy,
    elements,
    focusNodeId,
    visitedNodes,
    dispatch,
    isInitialization,
    updateSignal,
    fontFamily,
    mindmapAppName: mindmapAppName ?? '',
    theme,
    graphConfig: graphConfig,
  });

  useEffect(() => {
    if (!cy) return;
    const container = cy.container();
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      if (!cy) return;

      const isZoomingIn = event.deltaY < 0;
      const isZoomingOut = event.deltaY > 0;

      const zoom = +cy.zoom().toFixed(2);
      const minZoom = +cy.minZoom().toFixed(2);
      const maxZoom = +cy.maxZoom().toFixed(2);

      if (isZoomingIn && zoom >= maxZoom) {
        cy.userZoomingEnabled(false);
        debouncedSetIsFitGraphAvailable(true);
      } else if (isZoomingOut && zoom <= minZoom) {
        cy.userZoomingEnabled(false);
        debouncedSetIsFitGraphAvailable(false);
      } else {
        cy.userZoomingEnabled(true);
        if (zoom > minZoom) {
          debouncedSetIsFitGraphAvailable(true);
        }
      }
    };

    container.addEventListener('wheel', onWheel);
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [cy, debouncedSetIsFitGraphAvailable]);

  const fitGraphClickHandler = useCallback(() => {
    if (!cy) return;

    cy.minZoom(0);
    cy.animate({
      fit: {
        eles: cy.elements(),
        padding: GraphPadding,
      },
      duration: FitDurationMs,
      queue: false,
      complete: () => {
        cy.minZoom(cy.zoom());
      },
    });
    dispatch(ChatUIActions.setIsFitGraphAvailable(false));
  }, [cy, dispatch]);

  return (
    <div className="flex size-full flex-col">
      <div ref={cyRef} className="min-h-0 flex-1 overflow-hidden" />

      {deviceType !== DeviceType.Mobile && (
        <div className={classNames('shrink-0 flex gap-3', !isDesktop && 'mb-3')}>
          <LevelSwitcher />
          <FitGraph onClick={fitGraphClickHandler} />
        </div>
      )}
    </div>
  );
};

const areEqual = (prevProps: Props, nextProps: Props) => {
  return (
    (prevProps.updateSignal === nextProps.updateSignal &&
      prevProps.focusNodeId === nextProps.focusNodeId &&
      prevProps.isReady === nextProps.isReady &&
      prevProps.isChatHidden === nextProps.isChatHidden &&
      isEqual(prevProps.visitedNodes, nextProps.visitedNodes) &&
      isEqual(prevProps.elements, nextProps.elements) &&
      isEqual(prevProps.graphConfig, nextProps.graphConfig) &&
      prevProps.fontFamily === nextProps.fontFamily &&
      prevProps.robotStorageIcon === nextProps.robotStorageIcon &&
      prevProps.arrowBackStorageIcon === nextProps.arrowBackStorageIcon) ||
    nextProps.elements.length === 0
  );
};

// Memoized heavy inner component
const MemoInnerGraph = memo(InnerGraph, areEqual);

/**
 * Wrapper that forces a FULL remount when graphConfig.layout changes.
 * This guarantees a clean slate (refs/state/Cytoscape instance) between layouts.
 */
const GraphComponent = (props: Props) => {
  return <MemoInnerGraph key={props.graphConfig.layout} {...props} />;
};

export default GraphComponent;
