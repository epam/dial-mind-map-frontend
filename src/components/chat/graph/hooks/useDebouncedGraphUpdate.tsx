import { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { Core, LayoutOptions } from 'cytoscape';
import debounce from 'lodash/debounce';
import { cloneDeep } from 'lodash-es';
import { useEffect, useRef } from 'react';

import { NEW_QUESTION_LABEL } from '@/constants/app';
import { Edge, Element, GraphElement, Node } from '@/types/graph';

import { AnimationDurationMs, DefaultGraphDepth, InitLayoutOptions, MaxVisibleNodesCount } from '../options';
import { adjustMessages } from '../utils/adjustMessages';
import { filterInvalidEdges } from '../utils/graph/filterInvalidEdges';
import { getSubgraph } from '../utils/graph/getSubgraph';
import { markParents } from '../utils/graph/markParents';
import { unmarkParents } from '../utils/graph/unmarkParents';
import { adjustElementsStyles } from '../utils/styles/adjustElementsStyles';
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
}: UseDebouncedGraphUpdateProps) => {
  const cyRef = useRef(cy);
  const elementsRef = useRef(elements);
  const focusNodeIdRef = useRef(focusNodeId);
  const visitedNodesRef = useRef(visitedNodes);
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    cyRef.current = cy;
    elementsRef.current = elements;
    focusNodeIdRef.current = focusNodeId;
    visitedNodesRef.current = visitedNodes;
    dispatchRef.current = dispatch;
  }, [cy, elements, focusNodeId, visitedNodes, dispatch]);

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

        const nodeColorMap = adjustElementsStyles(cy, focusNodeId, visitedIds, previousNodeId);

        adjustMessages(cy, focusNode, dispatch, nodeColorMap, previousNodeId);

        cy.layout({
          randomize: false,
          ...InitLayoutOptions,
        } as LayoutOptions).run();

        cy.endBatch();
      },
      delay,
      {
        leading: true,
        trailing: true,
      },
    ),
  ).current;

  useEffect(() => {
    if (!cy || isInitialization || !(updateSignal > 0)) return;
    debouncedUpdate();
  }, [updateSignal, isInitialization, cy, debouncedUpdate]);

  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);
};
