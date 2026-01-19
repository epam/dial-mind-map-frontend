import { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { Core, LayoutOptions } from 'cytoscape';
import debounce from 'lodash/debounce';
import { cloneDeep } from 'lodash-es';
import { useEffect, useRef } from 'react';

import { NEW_QUESTION_LABEL } from '@/constants/app';
import { GraphConfig, GraphImgResourceKey, GraphLayoutType } from '@/types/customization';
import { Edge, Element, GraphElement, Node, SystemNodeDataKeys } from '@/types/graph';
import { isNode } from '@/utils/app/graph/typeGuards';

import { AnimationDurationMs, DefaultGraphDepth, InitLayoutOptions, MaxVisibleNodesCount } from '../options';
import { adjustMessages } from '../utils/adjustMessages';
import { filterInvalidEdges } from '../utils/graph/filterInvalidEdges';
import { getSubgraph } from '../utils/graph/getSubgraph';
import { applyClusteredAroundRoot } from '../utils/graph/layout';
import { markParents } from '../utils/graph/markParents';
import { unmarkParents } from '../utils/graph/unmarkParents';
import { sanitizeElements } from '../utils/sanitizeElements';
import { adjustElementsStyles, adjustNeonedNodeStyles } from '../utils/styles/adjustElementsStyles';
import { adjustCompoundNodes } from '../utils/visualization/adjustCompoundNodes';
import { hideEdges } from '../utils/visualization/hideEdges';
import { hideNodes } from '../utils/visualization/hideNodes';
import { showEdges } from '../utils/visualization/showEdges';
import { showNodes } from '../utils/visualization/showNode';

interface UseDebouncedGraphUpdateProps {
  cy: Core | null;
  elements: Element<GraphElement>[];
  focusNodeId: string;
  visitedNodes: Record<string, string>;
  dispatch: Dispatch<UnknownAction>;
  isInitialization: boolean;
  updateSignal: number;
  delay?: number;
  fontFamily?: string;
  mindmapAppName: string;
  theme: string;
  graphConfig: GraphConfig;
}

export const useDebouncedGraphUpdate = ({
  cy,
  elements,
  focusNodeId,
  visitedNodes,
  dispatch,
  isInitialization,
  updateSignal,
  delay = AnimationDurationMs + 300,
  fontFamily,
  mindmapAppName,
  theme,
  graphConfig,
}: UseDebouncedGraphUpdateProps) => {
  const cyRef = useRef(cy);
  const elementsRef = useRef(elements);
  const focusNodeIdRef = useRef(focusNodeId);
  const visitedNodesRef = useRef(visitedNodes);
  const dispatchRef = useRef(dispatch);
  const fontFamilyRef = useRef(fontFamily);
  const mindmapAppNameRef = useRef(mindmapAppName);
  const themeRef = useRef(theme);
  const graphConfigRef = useRef(graphConfig);

  useEffect(() => {
    cyRef.current = cy;
    elementsRef.current = elements;
    focusNodeIdRef.current = focusNodeId;
    visitedNodesRef.current = visitedNodes;
    dispatchRef.current = dispatch;
    fontFamilyRef.current = fontFamily;
    mindmapAppNameRef.current = mindmapAppName;
    themeRef.current = theme;
    graphConfigRef.current = graphConfig;
  }, [cy, elements, focusNodeId, visitedNodes, dispatch, fontFamily, mindmapAppName, theme, graphConfig]);

  const debouncedUpdate = useRef(
    debounce(
      () => {
        const cy = cyRef.current;
        const elements = elementsRef.current;
        const focusNodeId = focusNodeIdRef.current;
        const visitedNodes = visitedNodesRef.current;
        const dispatch = dispatchRef.current;

        if (!cy || elements.length === 0) return;

        cy.startBatch();
        const previousNodeId = visitedNodes[focusNodeId];

        let subgraphElements = cloneDeep(elements);
        const { validElements, invalidEdges } = filterInvalidEdges(subgraphElements);
        if (invalidEdges.length > 0) {
          console.warn(`Invalid edges: ${invalidEdges.map(e => e.data.id).join(', ')}`);
        }
        subgraphElements = validElements;

        const thinkingNode = elements.find(
          el => el.data.id === focusNodeId && (el.data as Node).label === NEW_QUESTION_LABEL,
        );

        if (thinkingNode) {
          subgraphElements = getSubgraph(
            subgraphElements,
            focusNodeId,
            DefaultGraphDepth,
            MaxVisibleNodesCount,
            previousNodeId,
          );
        }

        subgraphElements = unmarkParents(subgraphElements);
        subgraphElements = markParents(subgraphElements, focusNodeId);
        subgraphElements = sanitizeElements(subgraphElements, graphConfigRef.current.useNodeIconAsBgImage);

        const newNodes = subgraphElements.filter(el => !(el.data as any).source) as Element<Node>[];
        let currentNodes = cy.nodes();
        const focusNode = (elements.find(el => el.data.id === focusNodeId) ?? { data: { id: focusNodeId } })
          .data as Node;

        hideNodes(currentNodes, newNodes);

        currentNodes = cy.nodes();

        const newEdges = subgraphElements.filter(el => (el.data as any).source) as Element<Edge>[];
        showNodes(cy, newNodes, currentNodes, newEdges);

        const currentEdges = cy.edges();
        showEdges(cy, currentEdges, newEdges);
        hideEdges(currentEdges, newEdges);

        adjustCompoundNodes(cy, newNodes);

        const visitedIds = Object.entries(visitedNodes).flatMap(([k, v]) => [k, v]);
        if (focusNode?.icon) {
          const currentFocusNode = cy.getElementById(focusNodeId);
          if (currentFocusNode.data('icon') !== focusNode.icon) {
            currentFocusNode.data('icon', focusNode.icon);
          }
        }

        const nodeColorMap = adjustElementsStyles(
          cy,
          focusNodeId,
          visitedIds,
          previousNodeId,
          graphConfigRef.current,
          fontFamilyRef.current,
        );

        // Update styles for neon nodes and icons
        subgraphElements.forEach(el => {
          if (!isNode(el.data)) return;
          const node = cy.getElementById(el.data.id);
          const icon = isNode(el.data) && el.data.icon;
          if (icon != null && node.data('icon') !== icon) {
            node.data('icon', icon);
          }
          if (icon == null && node.data('icon')) {
            node.data('icon', null);
          }

          const isNeoned = el.data.neon;
          if (isNeoned && !node.data(SystemNodeDataKeys.Neon)) {
            node.data(SystemNodeDataKeys.Neon, true);
            adjustNeonedNodeStyles(node);
          }
          if (!isNeoned && node.data(SystemNodeDataKeys.Neon)) {
            node.data(SystemNodeDataKeys.Neon, false);
            node.data(SystemNodeDataKeys.Pulsating, false);
          }
        });

        adjustMessages({
          cyInstance: cy,
          focusNode,
          dispatch,
          nodeColorMap,
          previousNodeId,
          mindmapAppName: mindmapAppNameRef.current,
          theme: themeRef.current,
          defaultBgImg: graphConfigRef.current.images?.[GraphImgResourceKey.DefaultBgImg],
          isInitialization: null,
          needToUpdateInBucket: true,
        });

        if (graphConfigRef.current.layout === GraphLayoutType.EllipticRing) {
          applyClusteredAroundRoot(cy, { ANIMATE: true });
        } else {
          cy.layout({
            randomize: false,
            ...InitLayoutOptions,
          } as LayoutOptions).run();
        }

        cy.endBatch();
      },
      delay,
      {
        leading: false,
        trailing: true,
        maxWait: delay,
      },
    ),
  ).current;

  useEffect(() => {
    if (!cyRef.current || isInitialization || !(updateSignal > 0)) return;
    debouncedUpdate();
    return () => {
      debouncedUpdate.cancel();
    };
  }, [updateSignal, isInitialization, debouncedUpdate]);

  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);
};
