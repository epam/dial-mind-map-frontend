'use client';

import { createPopper } from '@popperjs/core';
import { IconChartBar, IconCurrentLocation } from '@tabler/icons-react';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';
import cytoscape, { BaseLayoutOptions, Core, EdgeSingular, EventObject, NodeSingular, Singular } from 'cytoscape';
import cxtmenu from 'cytoscape-cxtmenu';
import edgehandles from 'cytoscape-edgehandles';
import fcose from 'cytoscape-fcose';
import popper from 'cytoscape-popper';
import cloneDeep from 'lodash-es/cloneDeep';
import isEqual from 'lodash-es/isEqual';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import { Space } from '@/components/common/Space/Space';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { UpdateMode } from '@/store/builder/graph/graph.types';
import { useBuilderSelector } from '@/store/builder/hooks';
import { Edge, EdgeType, Element, GraphElement, Node, NodeStatus, PositionedElement } from '@/types/graph';
import { uuidv4 } from '@/utils/common/uuid';

import { Statistics } from './components/Statistics';
import {
  BaseEdgeHandlerOffset,
  BaseEdgeHandlerSize,
  getCytoscapeStyles,
  MaxEdgeHandlerSize,
  NodeNavigationDuration,
} from './options';
import { getClickPosition } from './utils/graph/edges';
import { getAvgEdgesPerNode, havePositions } from './utils/graph/metrics';
import { adjustFocusAndRootElementsStyles } from './utils/styles/styles';

cytoscape.use(fcose);
cytoscape.use(popper(createPopper));
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);

interface Props {
  elements: PositionedElement<GraphElement>[];
  rootNodeId: string;
  focusNodeId: string;
  focusEdgeId: string;
  highlightedNodeIds: string[];
  updateSignal: number;
  updateMode: UpdateMode;
  areGeneretadEdgesShowen: boolean;
  onFocusNodeChange: (node: Node) => void;
  onEdgeDelete: (edge: Edge) => void;
  onEdgeCreate: (edge: Edge) => void;
  onEdgeUpdate: (edge: Edge) => void;
  onNodesPositionsUpdate: (positionedNodes: PositionedElement<Node>[]) => void;
  onGeneratedElementsLayout: (nodes: PositionedElement<Node>[], edges: Element<Edge>[]) => void;
  onNodeCreate: (node: PositionedElement<Node>) => void;
  onNodeDelete: (node: Node, edgesIds: string[]) => void;
  onSetNodeAsRoot: (nodeId: string) => void;
}

const GraphComponent = ({
  elements,
  rootNodeId,
  focusNodeId,
  focusEdgeId,
  highlightedNodeIds,
  updateSignal,
  updateMode,
  areGeneretadEdgesShowen,
  onFocusNodeChange,
  onEdgeDelete,
  onEdgeCreate,
  onEdgeUpdate,
  onNodesPositionsUpdate,
  onGeneratedElementsLayout,
  onNodeCreate,
  onNodeDelete,
  onSetNodeAsRoot,
}: Props) => {
  const cyHtmlTagRef = useRef<HTMLDivElement>(null);
  const arePositionsSavedRef = useRef<boolean>(false);
  const isForcedPositionsSaveRef = useRef<boolean>(false);
  const generatedNodeIdRef = useRef('');
  const deferredUpdateSignal = useDeferredValue(updateSignal);

  const [pinnedStatistics, setPinnedStatistics] = useLocalStorageState<boolean | undefined>('pinnedStatistics', {
    defaultValue: false,
  });

  const mindmapFolder = useBuilderSelector(ApplicationSelectors.selectMindmapFolder);

  const nodeClickHandler = useCallback(
    (event: EventObject) => {
      const node = event.target.data();
      onFocusNodeChange(cloneDeep(node));
    },
    [onFocusNodeChange],
  );

  const cyRef = useRef<Core | null>(null);
  const prevRef = useRef<HTMLDivElement | null>(null);

  const cytoscapeStyles = useMemo(() => getCytoscapeStyles(mindmapFolder ?? ''), [mindmapFolder]);

  prevRef.current = cyHtmlTagRef.current;

  useEffect(() => {
    if (cyHtmlTagRef.current) {
      let layout: cytoscape.LayoutOptions | undefined;
      const isPositionedGraph = havePositions(elements);

      let graphElements = null;
      if (!areGeneretadEdgesShowen) {
        graphElements = cloneDeep(elements.filter(el => (el.data as Edge)?.type !== 'Generated'));
      } else {
        graphElements = cloneDeep(elements);
      }

      if (!isPositionedGraph) {
        layout = getFcoseLayoutOptions(elements);
      } else {
        layout = {
          name: 'preset',
          fit: true,
          padding: 5,
        } as BaseLayoutOptions;
      }

      const cy = cytoscape({
        container: cyHtmlTagRef.current,
        elements: graphElements,
        style: cytoscapeStyles,
        layout: layout,
      });
      cyRef.current = cy;

      adjustFocusAndRootElementsStyles(cyRef.current, focusNodeId, focusEdgeId, rootNodeId);

      cy.on('tap', 'node', event => {
        if (nodeClickHandler) {
          nodeClickHandler(event);
        }
      });

      cy.on('dbltap', event => {
        // Check if the event target is the core (empty space)
        if (event.target === cy && onNodeCreate) {
          const node = {
            data: {
              id: uuidv4(),
              label: 'New node',
              details: '',
              questions: [''],
              status: NodeStatus.Draft,
            },
            position: event.position,
          } as PositionedElement<Node>;

          onNodeCreate(cloneDeep(node));
          cy.add({
            ...node,
            group: 'nodes',
            // selected for some reason will not style the node
            // classes might be an alternative
            selected: true,
          });
        }
      });

      cy.on('dragfree', 'node', (event: EventObject) => {
        const node = event.target as NodeSingular;
        const position = node.position();

        if (onNodesPositionsUpdate) {
          onNodesPositionsUpdate([
            {
              data: {
                id: node.id(),
                label: node.data('label'),
              },
              position,
            },
          ]);
        }
      });

      cy.on('layoutstop', () => {
        if (
          (isForcedPositionsSaveRef.current || !isPositionedGraph) &&
          !arePositionsSavedRef.current &&
          onNodesPositionsUpdate
        ) {
          const nodes = cy.nodes().map(n => {
            if (generatedNodeIdRef.current === n.id()) {
              return {
                data: {
                  ...(n.data() as Node),
                  id: n.id(),
                },
                position: n.position(),
              } as PositionedElement<Node>;
            }

            return {
              data: {
                id: n.id(),
                status: (n.data() as Node).status ?? NodeStatus.Draft,
              },
              position: n.position(),
            } as PositionedElement<Node>;
          });

          if (generatedNodeIdRef.current) {
            const generatedNode = cy.getElementById(generatedNodeIdRef.current);
            const edges = generatedNode.connectedEdges().map(e => {
              return {
                data: {
                  id: e.id(),
                  source: e.source().id(),
                  target: e.target().id(),
                  type: (e.data() as Edge)?.type,
                },
              } as PositionedElement<Edge>;
            });

            generatedNodeIdRef.current = '';
            onGeneratedElementsLayout(nodes, edges);
            cy.animate({
              center: {
                eles: generatedNode,
              },
              duration: NodeNavigationDuration,
              queue: false,
            });
          } else {
            onNodesPositionsUpdate(nodes);
          }

          arePositionsSavedRef.current = true;
          isForcedPositionsSaveRef.current = false;
        }
      });

      return () => {
        cy.destroy();
      };
    }
  }, []);

  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.elements().removeClass('shaded');

    if (highlightedNodeIds.length < 1) return;

    cyRef.current.elements().addClass('shaded');
    const highlightedNodes = cyRef.current.$(highlightedNodeIds.map(id => `#${id}`).join(', '));
    highlightedNodes.removeClass('shaded');

    if (highlightedNodes.length === 1) {
      cyRef.current.animate({
        center: {
          eles: highlightedNodes,
        },
        duration: NodeNavigationDuration,
        queue: false,
      });
    } else {
      cyRef.current.animate({
        fit: {
          eles: highlightedNodes,
          padding: 0,
        },
        duration: NodeNavigationDuration,
        queue: false,
      });
    }
  }, [cyRef.current, highlightedNodeIds]);

  useEffect(() => {
    if (
      !cyRef.current ||
      updateSignal <= 1 ||
      updateMode !== UpdateMode.Refresh ||
      updateSignal === deferredUpdateSignal
    )
      return;

    let graphElements = null;
    if (!areGeneretadEdgesShowen) {
      graphElements = cloneDeep(elements.filter(el => (el.data as Edge)?.type !== 'Generated'));
    } else {
      graphElements = cloneDeep(elements);
    }

    cyRef.current.json({
      elements: graphElements,
    });

    adjustFocusAndRootElementsStyles(cyRef.current, focusNodeId, focusEdgeId, rootNodeId);

    const zeroNodes = cyRef.current.nodes().filter(n => n.position('x') === 0 && n.position('y') === 0);

    if (zeroNodes.length === 1) {
      const zeroNode = zeroNodes[0];
      cyRef.current.animate({
        center: {
          eles: zeroNode,
        },
        duration: NodeNavigationDuration,
        queue: false,
      });

      if (zeroNode.connectedEdges().length > 0) {
        const layout = getFcoseLayoutOptions(elements);
        layout.randomize = false;
        layout.fit = false;

        generatedNodeIdRef.current = zeroNode.id();
        arePositionsSavedRef.current = false;
        isForcedPositionsSaveRef.current = true;

        cyRef.current.layout(layout).run();
        return;
      }
    }

    cyRef.current
      .layout({
        name: 'preset',
        fit: false,
        animate: true,
        animationDuration: 250,
      })
      .run();
  }, [cyRef.current, updateSignal, updateMode, deferredUpdateSignal]);

  useEffect(() => {
    if (
      !cyRef.current ||
      updateSignal < 1 ||
      updateMode !== UpdateMode.Relayout ||
      updateSignal === deferredUpdateSignal
    )
      return;

    let layout = null;
    if (!areGeneretadEdgesShowen) {
      const filteredElements = cloneDeep(elements.filter(el => (el.data as Edge)?.type !== 'Generated'));
      layout = getFcoseLayoutOptions(filteredElements);
      cyRef.current.json({
        elements: filteredElements,
      });
    } else {
      layout = getFcoseLayoutOptions(elements);
    }

    arePositionsSavedRef.current = false;
    isForcedPositionsSaveRef.current = true;
    cyRef.current.layout(layout).run();
  }, [cyRef.current, updateSignal, updateMode, deferredUpdateSignal]);

  useEffect(() => {
    if (!cyRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the focus is on an input, textarea, or other interactive element
      const activeElement = document.activeElement as HTMLElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);

      if (isInputFocused) {
        return; // Do nothing if an input or textarea is focused
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedEdge = cyRef.current!.edges(':selected')?.first();

        if (selectedEdge?.id()) {
          if (onEdgeDelete) {
            onEdgeDelete(selectedEdge.data() as Edge);
          }
          cyRef.current!.remove(selectedEdge);
        }

        const selectedNode = cyRef.current!.nodes(':selected')?.first();
        if (selectedNode?.id()) {
          if (onNodeDelete) {
            const edgesIds = selectedNode.connectedEdges().map(e => e.id());
            onNodeDelete(selectedNode.data() as Node, edgesIds);
          }
          cyRef.current!.remove(selectedNode);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cyRef.current, onEdgeDelete, onNodeDelete]);

  useEffect(() => {
    if (!cyRef.current) return;

    window.cy = cyRef.current;

    const eh = cyRef.current.edgehandles({
      snapThreshold: 0,
      disableBrowserGestures: true,
      canConnect: (source: NodeSingular, target: NodeSingular) => {
        if (source.id() === target.id()) return false;

        const existingEdge = window.cy.edges(
          `[source = "${source.id()}"][target = "${target.id()}"][type != "Generated"]`,
        );

        return existingEdge.length === 0;
      },
    });

    let popperTop: any, popperBottom: any, popperLeft: any, popperRight: any;
    let popperNode: NodeSingular | null = null;
    let popperDivTop: HTMLDivElement | undefined;
    let popperDivBottom: HTMLDivElement | undefined;
    let popperDivLeft: HTMLDivElement | undefined;
    let popperDivRight: HTMLDivElement | undefined;
    let started = false;
    let originalEdge: EdgeSingular | null = null;

    const createPopperDiv = (handleSize: number, start: () => void): HTMLDivElement => {
      const div = document.createElement('div');
      div.classList.add('popper-handle');
      div.style.width = `${handleSize}px`;
      div.style.height = `${handleSize}px`;
      div.addEventListener('mousedown', start);
      document.body.appendChild(div);
      return div;
    };

    const createPopper = (node: NodeSingular, content: HTMLDivElement, placement: string, offset: number) => {
      return node.popper({
        content,
        popper: {
          strategy: 'absolute',
          placement,
          modifiers: [{ name: 'offset', options: { offset: [0, offset] } }],
        },
      });
    };

    const start = () => {
      if (popperNode) eh.start(popperNode);
    };

    const stop = () => {
      eh.stop();
    };

    const setHandleOn = (node: NodeSingular) => {
      if (started) return;

      removeHandle();

      popperNode = node;

      const zoom = cyRef.current!.zoom();
      const handleSize = Math.min(BaseEdgeHandlerSize * zoom, MaxEdgeHandlerSize);
      popperDivTop = createPopperDiv(handleSize, start);
      popperDivBottom = createPopperDiv(handleSize, start);
      popperDivLeft = createPopperDiv(handleSize, start);
      popperDivRight = createPopperDiv(handleSize, start);

      const offset = BaseEdgeHandlerOffset * zoom;
      popperTop = createPopper(node, popperDivTop, 'top', offset);
      popperBottom = createPopper(node, popperDivBottom, 'bottom', offset);
      popperLeft = createPopper(node, popperDivLeft, 'left', offset);
      popperRight = createPopper(node, popperDivRight, 'right', offset);
    };

    const removeHandle = () => {
      [popperTop, popperBottom, popperLeft, popperRight].forEach(popper => {
        if (popper) popper.destroy();
      });

      [popperDivTop, popperDivBottom, popperDivLeft, popperDivRight].forEach(div => {
        if (div) document.body.removeChild(div);
      });

      popperTop = popperBottom = popperLeft = popperRight = null;
      popperDivTop = popperDivBottom = popperDivLeft = popperDivRight = undefined;
      popperNode = null;
    };

    const handleMouseOver = (e: EventObject) => {
      const container = cyRef.current?.container();
      if (container) container.style.cursor = 'pointer';
      setHandleOn(e.target);
    };

    const handleMouseOut = () => {
      const container = cyRef.current?.container();
      if (container) container.style.cursor = 'default';
      removeHandle();
    };

    const handleGrab = () => removeHandle();
    const handleTap = (e: EventObject) => {
      if (e.target === cyRef.current) removeHandle();
    };
    const handleMouseUp = () => stop();
    const handleEhStart = () => {
      started = true;
    };
    const handleEhStop = () => {
      started = false;
    };
    const handleMouseDown = (event: EventObject) => {
      const edge = event.target as EdgeSingular;
      const position = getClickPosition(event, edge);

      if (position === 'head') {
        originalEdge = edge;
        edge.addClass('ghost-edge');
        const sourceNode = cyRef.current!.getElementById(edge.data('source')) as NodeSingular;
        eh.start(sourceNode);
      }
    };

    const handleEhComplete = (
      _event: any,
      _sourceNode: NodeSingular,
      _targetNode: NodeSingular,
      addedEdge: EdgeSingular,
    ) => {
      const newEdge = addedEdge.data() as Edge;

      if (!originalEdge && onEdgeCreate) {
        onEdgeCreate(cloneDeep(newEdge));
      }

      if (originalEdge) {
        originalEdge.move({
          source: addedEdge.data().source,
          target: addedEdge.data().target,
        });

        if (onEdgeUpdate) {
          const edge = originalEdge.data() as Edge;
          if (edge.type !== EdgeType.Manual) edge.type = EdgeType.Manual;
          onEdgeUpdate(edge);
        }

        addedEdge.remove();
        originalEdge.removeClass('ghost-edge');
        originalEdge = null;
      }
    };

    const handleEhStopFinal = () => {
      if (originalEdge) {
        originalEdge.removeClass('ghost-edge');
        originalEdge = null;
      }
    };

    const addEventListeners = () => {
      cyRef.current!.on('mouseover', 'node', handleMouseOver);
      cyRef.current!.on('mouseout', 'node', handleMouseOut);
      cyRef.current!.on('grab', 'node', handleGrab);
      cyRef.current!.on('tap', handleTap);
      cyRef.current!.on('zoom pan', handleMouseOut);
      window.addEventListener('mouseup', handleMouseUp);
      cyRef.current!.on('ehstart', handleEhStart);
      cyRef.current!.on('ehstop', handleEhStop);
      cyRef.current!.on('mousedown', 'edge', handleMouseDown);
      cyRef.current!.on('ehcomplete', handleEhComplete);
      cyRef.current!.on('ehstop', handleEhStopFinal);
    };

    const removeEventListeners = () => {
      cyRef.current!.removeListener('mouseover', 'node', handleMouseOver);
      cyRef.current!.removeListener('mouseout', 'node', handleMouseOut);
      cyRef.current!.removeListener('grab', 'node', handleGrab);
      cyRef.current!.removeListener('tap', handleTap);
      cyRef.current!.removeListener('zoom pan', handleMouseOut);
      window.removeEventListener('mouseup', handleMouseUp);
      cyRef.current!.removeListener('ehstart', handleEhStart);
      cyRef.current!.removeListener('ehstop', handleEhStop);
      cyRef.current!.removeListener('mousedown', 'edge', handleMouseDown);
      cyRef.current!.removeListener('ehcomplete', handleEhComplete);
      cyRef.current!.removeListener('ehstop', handleEhStopFinal);
    };

    addEventListeners();

    return () => {
      removeEventListeners();
      removeHandle();
    };
  }, [cyRef.current]);

  useEffect(() => {
    if (!cyRef.current) return;

    const nodesMenu = cyRef.current.cxtmenu({
      menuRadius: 100,
      selector: 'node',
      commands: [
        {
          content: 'Delete',
          select: (ele: Singular) => {
            if (ele.isNode() && onNodeDelete) {
              const node = ele as NodeSingular;
              const edgesIds = node.connectedEdges().map(e => e.id());
              onNodeDelete(node.data(), edgesIds);
            }
            ele.remove();
          },
        },
        {
          content: 'Set as root',
          select: (ele: Singular) => {
            if (ele.isNode()) {
              onSetNodeAsRoot(ele.id());
            }
          },
        },
      ],
      openMenuEvents: 'cxttapstart',
    });

    const edgesMenu = cyRef.current.cxtmenu({
      menuRadius: 100,
      selector: 'edge',
      commands: [
        {
          content: 'Delete',
          select: (ele: Singular) => {
            if (ele.isEdge()) {
              onEdgeDelete(ele.data());
            }
            ele.remove();
          },
        },
      ],
      openMenuEvents: 'cxttapstart',
    });

    return () => {
      nodesMenu.destroy();
      edgesMenu.destroy();
    };
  }, [cyRef.current]);

  return (
    <div className="relative size-full">
      <div ref={cyHtmlTagRef} className="size-full" />
      {pinnedStatistics && (
        <div className="absolute right-3 top-0 z-10">
          <Statistics setPinnedStatistics={setPinnedStatistics} pinnedStatistics={pinnedStatistics} />
        </div>
      )}
      <Space size={2} className="absolute bottom-3 right-3">
        {!pinnedStatistics && (
          <Tooltip
            tooltip={<Statistics setPinnedStatistics={setPinnedStatistics} pinnedStatistics={pinnedStatistics} />}
          >
            <button className="rounded-l bg-layer-1 p-2">
              <IconChartBar size={18} className="text-secondary hover:text-accent-primary" />
            </button>
          </Tooltip>
        )}

        <Tooltip tooltip="Fit to Center" contentClassName="text-sm px-2 text-primary">
          <button
            onClick={() => {
              if (cyRef.current) {
                cyRef.current.fit(undefined, 5);
              }
            }}
            className={classNames('rounded-r bg-layer-1 p-2', pinnedStatistics && 'rounded-l')}
          >
            <IconCurrentLocation size={18} className="text-secondary hover:text-accent-primary" />
          </button>
        </Tooltip>
      </Space>
    </div>
  );
};

const areEqual = (prevProps: Props, nextProps: Props) => {
  return (
    prevProps.updateSignal === nextProps.updateSignal &&
    prevProps.updateMode === nextProps.updateMode &&
    prevProps.highlightedNodeIds === nextProps.highlightedNodeIds &&
    isEqual(prevProps.elements, nextProps.elements) &&
    prevProps.areGeneretadEdgesShowen === nextProps.areGeneretadEdgesShowen
  );
};

export default memo(GraphComponent, areEqual);

function getFcoseLayoutOptions(elements: Element<GraphElement>[]) {
  const avgDegree = getAvgEdgesPerNode(elements);

  const fcoseLayoutOptions = {
    name: 'fcose',
    nodeRepulsion: 5000,
    idealEdgeLength: 50,
    gravity: 0,
    animate: true,
    fit: true,
    padding: 5,
    randomize: true,
  };

  // Set thresholds for simplicity
  const complexGraphAvgDegreeThreshold = 2;

  if (avgDegree >= complexGraphAvgDegreeThreshold) {
    // Complex graph settings
    fcoseLayoutOptions.nodeRepulsion = 70000;
    fcoseLayoutOptions.idealEdgeLength = 150;
  }

  return fcoseLayoutOptions;
}
