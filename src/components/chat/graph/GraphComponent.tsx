'use client';

import cytoscape, { Core, CoseLayoutOptions, ElementAnimateOptionsBase, EventObject, NodeSingular } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import cloneDeep from 'lodash-es/cloneDeep';
import isEqual from 'lodash-es/isEqual';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { Element, GraphElement, Node } from '@/types/graph';

import { useDebouncedGraphUpdate } from './hooks/useDebouncedGraphUpdate';
import { useThrottledResizeGraph } from './hooks/useThrottledResizeGraph';
import {
  ExtraFontWhileHovering,
  ExtraWidthForNodesWithImages,
  FitDurationMs,
  getCytoscapeStyles,
  GraphPadding,
  HoverDurationMs,
  InitLayoutOptions,
  SecondLayoutOptions,
} from './options';
import { adjustMessages } from './utils/adjustMessages';
import { filterInvalidEdges } from './utils/graph/filterInvalidEdges';
import { markParents } from './utils/graph/markParents';
import { adjustElementsStyles, adjustNeonedNodeStyles } from './utils/styles/adjustElementsStyles';
import { extractNumberFromString, getWidth } from './utils/styles/styles';

cytoscape.use(fcose);

interface Props {
  elements: Element<GraphElement>[];
  focusNodeId: string;
  isReady: boolean;
  visitedNodes: Record<string, string>;
  updateSignal: number;
  isChatHidden: boolean;
  onFocusNodeChange: (node: Node) => void;
}

const GraphComponent = ({
  elements,
  focusNodeId,
  visitedNodes,
  onFocusNodeChange,
  updateSignal,
  isReady,
  isChatHidden,
}: Props) => {
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
  const [isInitialization, setIsInitialization] = useState(true);
  const [cy, setCy] = useState<Core | null>(null);
  const neonStartedRef = useRef(false);
  const hoveredNodeFontSizesRef = useRef<Map<string, number>>(new Map<string, number>());

  const mindmapFolder = useChatSelector(ApplicationSelectors.selectMindmapFolder);
  const cytoscapeStyles: cytoscape.StylesheetStyle[] = getCytoscapeStyles(mindmapFolder ?? '');

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

      const cy = cytoscape({
        container: cyRef.current,
        elements: subgraphElements,
        style: cytoscapeStyles,
        layout: {
          randomize: true,
          ...InitLayoutOptions,
        } as CoseLayoutOptions,
      });

      cy.on('tap', 'node', event => {
        const node = event.target as NodeSingular;
        if (node.hasClass('focused') || node.hasClass('notap')) {
          return;
        }

        nodeClickHandler(event);
        setIsInitialization(false);
        hoveredNodeFontSizesRef.current = new Map<string, number>();
      });

      cy.on('mouseover', 'node', event => {
        const node = event.target as NodeSingular;
        if (node.hasClass('focused')) {
          return;
        }

        const container = cy.container();
        if (container) {
          container.style.cursor = 'pointer';
        }

        if (node.data('neon')) {
          return;
        }

        let fontSize = extractNumberFromString(node.style('font-size'));
        if (!hoveredNodeFontSizesRef.current.has(node.id())) {
          hoveredNodeFontSizesRef.current.set(node.id(), fontSize);
        } else {
          fontSize = hoveredNodeFontSizesRef.current.get(node.id())!;
        }
        fontSize += ExtraFontWhileHovering;

        const styles: ElementAnimateOptionsBase['style'] = {
          'font-size': fontSize + 'px',
          width: getWidth(node, fontSize),
        };
        if (node.hasClass('imaged') || node.data('icon')) {
          styles.width += ExtraWidthForNodesWithImages;
        }

        node.animate({ style: styles }, { duration: HoverDurationMs, queue: false });
      });

      cy.on('mouseout', 'node', event => {
        const node = event.target;

        if (node.hasClass('focused')) {
          return;
        }

        const container = cy.container();
        if (container) {
          container.style.cursor = 'default';
        }

        if (node.data('neon')) {
          return;
        }

        if (hoveredNodeFontSizesRef.current.has(node.id())) {
          const fontSize = hoveredNodeFontSizesRef.current.get(node.id())!;
          const styles: ElementAnimateOptionsBase['style'] = {
            'font-size': fontSize + 'px',
            width: getWidth(node, fontSize),
          };
          if (node.hasClass('imaged') || node.data('icon')) {
            styles.width += ExtraWidthForNodesWithImages;
          }
          node.animate({ style: styles }, { duration: HoverDurationMs, queue: false });
        }
      });

      cy.on('layoutstart', () => {
        cy.nodes().forEach(node => {
          node.addClass('notap');
        });
        cy.nodes('[?neon]').forEach(node => {
          node.data('pulsating', false);
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

          cy.layout(SecondLayoutOptions).run();
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
              cy.nodes().forEach(node => {
                if (node.data('neon')) {
                  adjustNeonedNodeStyles(node);
                }
                node.removeClass('notap');
              });
            },
          });
        }
      });

      setCy(cy);

      const visitedNodesIds = Object.entries(visitedNodes).flatMap(([key, value]) => [key, value]);
      const nodeColorMap = adjustElementsStyles(cy, focusNodeId, visitedNodesIds, previousNodeId);

      const focusNode = (elements.find(el => el.data.id === focusNodeId) ?? { data: { id: focusNodeId } }).data as Node;

      adjustMessages(cy, focusNode, dispatch, nodeColorMap, previousNodeId, true);

      return () => {
        cy.destroy();
      };
    }
  }, [isReady, isChatHidden]);

  useThrottledResizeGraph(cy);

  useDebouncedGraphUpdate({
    cy,
    elements,
    focusNodeId,
    visitedNodes,
    dispatch,
    isInitialization,
    updateSignal,
  });

  return <div ref={cyRef} style={{ width: '100%', height: '100%' }} />;
};

const areEqual = (prevProps: Props, nextProps: Props) => {
  return (
    (prevProps.updateSignal === nextProps.updateSignal &&
      prevProps.focusNodeId === nextProps.focusNodeId &&
      prevProps.isReady === nextProps.isReady &&
      prevProps.isChatHidden === nextProps.isChatHidden &&
      isEqual(prevProps.visitedNodes, nextProps.visitedNodes) &&
      isEqual(prevProps.elements, nextProps.elements)) ||
    nextProps.elements.length === 0
  );
};

export default memo(GraphComponent, areEqual);
