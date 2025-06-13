'use client';

import classNames from 'classnames';
import { useCallback } from 'react';

import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import { CompletionSelectors } from '@/store/builder/completion/completion.selectors';
import { GraphActions, GraphSelectors } from '@/store/builder/graph/graph.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { Edge, Element, Node, PositionedElement } from '@/types/graph';

import { NodeEditorResizeWrapper } from '../node/components/NodeEditorResizeWrapper';
import NodeEditor from '../node/NodeEditor';
import { ErrorGraph } from './ErrorGraph/ErrorGraph';
import GraphComponent from './GraphComponent/GraphComponent';
import TableView from './TableView/TableView';

export const GraphEditor = () => {
  const dispatch = useBuilderDispatch();
  const elements = useBuilderSelector(GraphSelectors.selectElements);
  const rootNodeId = useBuilderSelector(GraphSelectors.selectRootNodeId);
  const focusNodeId = useBuilderSelector(GraphSelectors.selectFocusNodeId);
  const focusNode = useBuilderSelector(GraphSelectors.selectFocusNode);
  const focusEdgeId = useBuilderSelector(GraphSelectors.selectFocusEdgeId);
  const highlightedNodeIds = useBuilderSelector(GraphSelectors.selectHighlightedNodeIds);
  const updateSignal = useBuilderSelector(GraphSelectors.selectUpdateSignal);
  const updateMode = useBuilderSelector(GraphSelectors.selectUpdateMode);
  const isNodeEditorOpen = useBuilderSelector(UISelectors.selectIsNodeEditorOpen);
  const currentView = useBuilderSelector(UISelectors.selectCurrentView);
  const areGeneretedEdgesShowen = useBuilderSelector(UISelectors.selectAreGeneretedEdgesShowen);
  const isMessageStreaming = useBuilderSelector(CompletionSelectors.selectIsMessageStreaming);
  const isGraphReady = useBuilderSelector(GraphSelectors.selectIsReady);
  const focusNodeHandler = useCallback(
    (node: Node) => {
      dispatch(GraphActions.setFocusNodeId(node.id));
      dispatch(UIActions.setIsNodeEditorOpen(true));
    },
    [dispatch],
  );

  const edgeDeleteHandler = useCallback(
    (edge: Edge) => {
      dispatch(BuilderActions.deleteEdge(edge.id));
    },
    [dispatch],
  );

  const edgeCreateHandler = useCallback(
    (edge: Edge) => {
      dispatch(BuilderActions.createEdge(edge));
    },
    [dispatch],
  );

  const edgeUpdateHandler = useCallback(
    (edge: Edge) => {
      dispatch(BuilderActions.updateEdge(edge));
    },
    [dispatch],
  );

  const updateNodesPositionsHandler = useCallback(
    (positionedNodes: PositionedElement<Node>[]) => {
      dispatch(BuilderActions.updateNodesPositions(positionedNodes));
    },
    [dispatch],
  );

  const generatedElementsLayoutHandler = useCallback(
    (nodes: PositionedElement<Node>[], edges: Element<Edge>[]) => {
      dispatch(BuilderActions.patch({ nodes, edges }));
    },
    [dispatch],
  );

  const nodeCreateHandler = useCallback(
    (node: PositionedElement<Node>) => {
      dispatch(BuilderActions.createNode(node));
    },
    [dispatch],
  );

  const nodeDeleteHandler = useCallback(
    (node: Node, edgesIds: string[]) => {
      dispatch(UIActions.setIsNodeEditorOpen(false));
      dispatch(BuilderActions.deleteNode({ nodeId: node.id, edgesIds }));
    },
    [dispatch],
  );

  const setNodeAsRootHanler = useCallback(
    (nodeId: string) => {
      dispatch(BuilderActions.setNodeAsRoot(nodeId));
    },
    [dispatch],
  );

  return (
    <div className={classNames(['flex flex-row h-full relative', currentView === 'table' && '!h-[calc(100%-82px)]'])}>
      {isGraphReady ? (
        <>
          {isNodeEditorOpen && !!focusNode && (
            <div
              className={classNames([
                'z-10 flex flex-col',
                currentView === 'graph' ? 'absolute left-3 h-[calc(100%-12px)]' : 'ml-3 h-full',
              ])}
            >
              <div className="flex h-full flex-1 flex-col gap-4">
                <NodeEditorResizeWrapper>
                  <NodeEditor />
                </NodeEditorResizeWrapper>
              </div>
            </div>
          )}
          <div
            className={classNames([
              'flex-1 h-full w-full',
              currentView === 'table' && 'overflow-auto shadow-mindmap mx-3 rounded',
              isMessageStreaming && 'opacity-50 pointer-events-none',
            ])}
          >
            {currentView === 'graph' ? (
              <GraphComponent
                elements={elements}
                rootNodeId={rootNodeId}
                focusNodeId={focusNodeId}
                focusEdgeId={focusEdgeId}
                highlightedNodeIds={highlightedNodeIds}
                updateSignal={updateSignal}
                updateMode={updateMode}
                areGeneretadEdgesShowen={areGeneretedEdgesShowen}
                onFocusNodeChange={focusNodeHandler}
                onEdgeDelete={edgeDeleteHandler}
                onEdgeCreate={edgeCreateHandler}
                onEdgeUpdate={edgeUpdateHandler}
                onNodesPositionsUpdate={updateNodesPositionsHandler}
                onGeneratedElementsLayout={generatedElementsLayoutHandler}
                onNodeCreate={nodeCreateHandler}
                onNodeDelete={nodeDeleteHandler}
                onSetNodeAsRoot={setNodeAsRootHanler}
              />
            ) : (
              <TableView />
            )}
          </div>
        </>
      ) : (
        <ErrorGraph />
      )}
    </div>
  );
};
