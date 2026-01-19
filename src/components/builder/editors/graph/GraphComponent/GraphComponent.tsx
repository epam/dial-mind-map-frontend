'use client';

import { createPopper } from '@popperjs/core';
import { IconChartBar, IconCurrentLocation } from '@tabler/icons-react';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';
import cytoscape, { BaseLayoutOptions, Core, EdgeSingular, EventObject, NodeSingular, Singular } from 'cytoscape';
import { Position } from 'cytoscape';
import cxtmenu from 'cytoscape-cxtmenu';
import edgehandles from 'cytoscape-edgehandles';
import fcose from 'cytoscape-fcose';
import popper from 'cytoscape-popper';
import cloneDeep from 'lodash-es/cloneDeep';
import isEqual from 'lodash-es/isEqual';
import omit from 'lodash-es/omit';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import { Space } from '@/components/common/Space/Space';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { UpdateMode } from '@/store/builder/graph/graph.types';
import { useBuilderSelector } from '@/store/builder/hooks';
import { Edge, EdgeType, Element, GraphElement, Node, NodeStatus, PositionedElement, ReverseEdge } from '@/types/graph';
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
import { mergeBidirectionalEdges } from './utils/graph/mergeBidirectionalEdges';
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
  isProdEnv: boolean;
  onFocusNodeChange: (node: Node) => void;
  onEdgeDelete: (edge: Edge) => void;
  onEdgeCreate: (edge: Edge) => void;
  onEdgeUpdate: (edge: Edge) => void;
  onNodesPositionsUpdate: (positionedNodes: PositionedElement<Node>[], historySkip?: boolean) => void;
  onGeneratedElementsLayout: (nodes: PositionedElement<Node>[], edges: Element<Edge>[]) => void;
  onNodeCreate: (node: PositionedElement<Node>) => void;
  onNodeDelete: (node: Node, edgesIds: string[]) => void;
  onSetNodeAsRoot: (nodeId: string) => void;
  onPatchEdges: ({ edges, edgesIdsToDelete }: { edges?: Element<Edge>[]; edgesIdsToDelete?: string[] }) => void;
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
  isProdEnv,
  onFocusNodeChange,
  onEdgeDelete,
  onEdgeCreate,
  onEdgeUpdate,
  onNodesPositionsUpdate,
  onGeneratedElementsLayout,
  onNodeCreate,
  onNodeDelete,
  onSetNodeAsRoot,
  onPatchEdges,
}: Props) => {
  cytoscape.warnings(!isProdEnv);

  const cyHtmlTagRef = useRef<HTMLDivElement>(null);
  const arePositionsSavedRef = useRef<boolean>(false);
  const isForcedPositionsSaveRef = useRef<boolean>(false);
  const generatedNodeIdRef = useRef('');
  const deferredUpdateSignal = useDeferredValue(updateSignal);

  const [pinnedStatistics, setPinnedStatistics] = useLocalStorageState<boolean | undefined>('pinnedStatistics', {
    defaultValue: false,
  });

  const mindmapId = useBuilderSelector(ApplicationSelectors.selectApplicationName);

  const nodeClickHandler = useCallback(
    (event: EventObject) => {
      const node = event.target.data();
      onFocusNodeChange(cloneDeep(node));
    },
    [onFocusNodeChange],
  );

  const createPositionedNode = useCallback(
    (cy: Core, position: Position) => {
      const node = {
        data: {
          id: uuidv4(),
          label: 'New node',
          details: '',
          questions: [''],
          status: NodeStatus.Draft,
        },
        position,
      } as PositionedElement<Node>;

      onNodeCreate(cloneDeep(node));
      cy.add({
        ...node,
        group: 'nodes',
        // selected for some reason will not style the node
        // classes might be an alternative
        selected: true,
      });
    },
    [onNodeCreate],
  );

  const cyRef = useRef<Core | null>(null);
  const prevRef = useRef<HTMLDivElement | null>(null);

  const cytoscapeStyles = useMemo(() => getCytoscapeStyles(mindmapId ?? ''), [mindmapId]);

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

      graphElements = mergeBidirectionalEdges(graphElements);

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
        wheelSensitivity: 0.4,
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
        if (event.target === cy) {
          createPositionedNode(cy, event.position);
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
            onNodesPositionsUpdate(nodes, updateMode === 'refresh' ? true : undefined);
          }

          arePositionsSavedRef.current = true;
          isForcedPositionsSaveRef.current = false;
        }
      });

      return () => {
        cy.destroy();
      };
    }
  }, [updateMode]);

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

    graphElements = mergeBidirectionalEdges(graphElements);

    cyRef.current.elements().remove();
    cyRef.current.add(graphElements);

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
          const reverseEdge = selectedEdge.data('reverseEdge');
          if (!reverseEdge) {
            onEdgeDelete(selectedEdge.data() as Edge);
          } else {
            onPatchEdges({ edgesIdsToDelete: [selectedEdge.id(), reverseEdge.id] });
          }
          cyRef.current!.remove(selectedEdge);
        }

        const selectedNode = cyRef.current!.nodes(':selected')?.first();
        if (selectedNode?.id()) {
          if (onNodeDelete) {
            const edgesIds: string[] = [];
            selectedNode.connectedEdges().forEach(edge => {
              edgesIds.push(edge.id());
              const reverseEdge = edge.data('reverseEdge');
              if (reverseEdge) {
                edgesIds.push(reverseEdge.id);
              }
            });
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
  }, [cyRef.current, onEdgeDelete, onNodeDelete, onPatchEdges]);

  useEffect(() => {
    if (!cyRef.current) return;

    window.cy = cyRef.current;

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

    const eh = cyRef.current.edgehandles({
      snapThreshold: 0,
      disableBrowserGestures: true,
      canConnect: (source: NodeSingular, target: NodeSingular) => {
        if (source.id() === target.id()) return false;

        const cy = window.cy;

        const forwardAll = cy.edges(`[source="${source.id()}"][target="${target.id()}"]`);
        const backwardAll = cy.edges(`[source="${target.id()}"][target="${source.id()}"]`);

        const forwardLimited = forwardAll.filter(e => e.data('type') !== EdgeType.Generated);
        const backwardLimited = backwardAll.filter(e => e.data('type') !== EdgeType.Generated);

        const noForwardLimited = forwardLimited.length === 0;
        const noBackwardLimited = backwardLimited.length === 0;
        const noForwardAll = forwardAll.length === 0;
        const noBackwardAll = backwardAll.length === 0;

        const onlyOriginalForward =
          !!originalEdge && forwardAll.length === 1 && forwardAll[0].id() === originalEdge.id();

        const noBidirectionalBackwardLimited = !backwardLimited.some(e => !!e.data('reverseEdge'));
        const noBidirectionalBackwardAll = !backwardAll.some(e => !!e.data('reverseEdge'));

        if (originalEdge) {
          const isBidirectional = !!originalEdge.data('reverseEdge');
          const isDashedEdge = originalEdge.data('type') === EdgeType.Generated;

          if (onlyOriginalForward) {
            // Allow moving the exact same edge (e.g., upgrading from generated -> manual)
            return true;
          }

          if (isDashedEdge) {
            if (isBidirectional) {
              // Allow moving a bidirectional dashed edge
              // only if there are absolutely no other edges between the nodes (any type, any direction).
              return noForwardAll && noBackwardAll;
            }

            // Allow dashed edge only when there's no forward edge of any type
            // and no backward edge that is bidirectional (consider all types for backward)
            return noForwardAll && noBidirectionalBackwardAll;
          }

          if (isBidirectional) {
            // Allow bi-edges to override dashed edges only when there's no manual edge in either direction
            return noForwardLimited && noBackwardLimited;
          }

          // Allow moving an existing non-dashed edge if it wouldn't create a duplicate:
          // no forward edge of any type, and no backward manual/bi-edge conflict
          if (noForwardAll && noBidirectionalBackwardLimited) {
            return true;
          }
        } else {
          // Creating a brand new edge: allow when there is no forward edge of any type
          // and there are no backward manual/bi-edge conflicts
          if (noForwardAll && noBidirectionalBackwardLimited) {
            return true;
          }
        }

        // Otherwise, forbid the connection
        return false;
      },
    });

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

      if (position === 'tail') {
        const reverseEdge = edge.data('reverseEdge');

        if (reverseEdge) {
          originalEdge = edge;
          edge.addClass('ghost-edge');
          const sourceNode = cyRef.current!.getElementById((reverseEdge as ReverseEdge).source) as NodeSingular;
          eh.start(sourceNode);
        }
      }
    };

    const handleEhComplete = (
      _event: any,
      _sourceNode: NodeSingular,
      _targetNode: NodeSingular,
      addedEdge: EdgeSingular,
    ) => {
      const addedEdgeData = addedEdge.data() as Edge;

      if (!originalEdge) {
        const newEdge = cloneDeep(addedEdgeData);

        if (newEdge.type !== EdgeType.Manual) {
          newEdge.type = EdgeType.Manual;
          addedEdge.data('type', EdgeType.Manual);
        }

        onEdgeCreate(newEdge);
      } else {
        const reverseEdge = (originalEdge.data() as Edge).reverseEdge;
        const isBidirectionalEdge = !!reverseEdge;

        originalEdge.move({
          source: addedEdgeData.source,
          target: addedEdgeData.target,
        });

        if (!isBidirectionalEdge) {
          const edge = omit(originalEdge.data() as Edge, 'reverseEdge');
          if (edge.type !== EdgeType.Manual) {
            edge.type = EdgeType.Manual;
            originalEdge.data('type', EdgeType.Manual);
          }
          onEdgeUpdate(edge);
        } else {
          const originalEdgeId = originalEdge.id();

          const forward = cyRef.current!.edges(
            `[source = "${addedEdgeData.source}"][target = "${addedEdgeData.target}"][type != "Manual"][id != "${originalEdgeId}"][id != "${addedEdgeData.id}"]`,
          );
          const backward = cyRef.current!.edges(
            `[source = "${addedEdgeData.target}"][target = "${addedEdgeData.source}"][type != "Manual"][id != "${originalEdgeId}"][id != "${addedEdgeData.id}"]`,
          );

          const edgesIdsToDelete = new Set<string>();

          const deleteEdges = (e: EdgeSingular) => {
            const edge = e.data() as Edge;
            edgesIdsToDelete.add(edge.id);
            e.remove();
            if (edge.reverseEdge) {
              edgesIdsToDelete.add(edge.reverseEdge.id);
              cyRef.current!.$id(edge.reverseEdge.id).remove();
            }
          };

          forward.forEach(deleteEdges);
          backward.forEach(deleteEdges);

          if (reverseEdge.type !== EdgeType.Manual) reverseEdge.type = EdgeType.Manual;
          reverseEdge.source = addedEdge.data().target;
          reverseEdge.target = addedEdge.data().source;

          const edge = omit(originalEdge.data() as Edge, 'reverseEdge');
          if (edge.type !== EdgeType.Manual) {
            edge.type = EdgeType.Manual;
            originalEdge.data('type', EdgeType.Manual);
          }

          onPatchEdges({
            edges: [{ data: omit(edge, 'weight') }, { data: omit(reverseEdge, 'weight') }],
            edgesIdsToDelete: Array.from(edgesIdsToDelete),
          });
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
              const edgesIds: string[] = [];
              node.connectedEdges().forEach(edge => {
                edgesIds.push(edge.id());
                const reverseEdge = edge.data('reverseEdge') as ReverseEdge;
                if (reverseEdge) {
                  edgesIds.push(reverseEdge.id);
                }
              });
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
            const reverseEdge = ele.data('reverseEdge') as ReverseEdge;
            if (!reverseEdge) {
              onEdgeDelete(ele.data());
            } else {
              onPatchEdges({ edgesIdsToDelete: [ele.id(), reverseEdge.id] });
            }

            ele.remove();
          },
        },
      ],
      openMenuEvents: 'cxttapstart',
    });

    const coreMenu = cyRef.current.cxtmenu({
      menuRadius: 100,
      selector: 'core',
      commands: [
        {
          content: 'Create node',
          select: (ele: Singular | null, event?: EventObject) => {
            if (!event || !cyRef.current) return;

            createPositionedNode(cyRef.current, event.position);
          },
        },
      ],
      openMenuEvents: 'cxttapstart',
    });

    return () => {
      nodesMenu.destroy();
      edgesMenu.destroy();
      coreMenu.destroy();
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

        <Tooltip tooltip="Fit graph" contentClassName="text-sm px-2 text-primary">
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
