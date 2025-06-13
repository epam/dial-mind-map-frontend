import { Action } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import merge from 'lodash-es/merge';
import { concat, concatMap, EMPTY, filter, map, mergeMap, of } from 'rxjs';

import { MindmapUrlHeaderName } from '@/constants/http';
import { Edge, Element, Node, PositionedElement } from '@/types/graph';
import { HTTPMethod } from '@/types/http';
import { BuilderRootEpic } from '@/types/store';
import { isEdge } from '@/utils/app/graph/typeGuards';

import { ApplicationSelectors } from '../../application/application.reducer';
import { GraphActions, GraphSelectors } from '../../graph/graph.reducers';
import { HistoryActions } from '../../history/history.reducers';
import { UIActions } from '../../ui/ui.reducers';
import { handleRequest } from '../../utils/handleRequest';
import { BuilderActions } from '../builder.reducers';

export const updateNodesPositionsEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.updateNodesPositions.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      elements: GraphSelectors.selectElements(state$.value),
    })),
    concatMap(({ payload, name, elements }) => {
      const body = {
        nodes: payload,
      };

      const optimisticActions: Action[] = [
        // HistoryActions.setIsRedo(false),
        GraphActions.setElements({
          //TO-DO: Update Elements types to be more specific
          elements: elements.map((el: any) => {
            const changedNode = payload.find(node => node.data.id === el.data.id);
            if (changedNode) {
              return cloneDeep({
                ...el,
                position: changedNode.position,
                data: {
                  ...el.data,
                  status: el.data.status ?? changedNode.data.status,
                },
              });
            }
            return el;
          }),
          skipLayout: true,
        }),
      ];

      const isInitialLoayout = elements
        .filter(el => !isEdge(el.data))
        .every(node => !node.position || (node.position.x === 0 && node.position.y === 0));

      if (!isInitialLoayout) {
        optimisticActions.push(HistoryActions.setIsUndo(true));
      }

      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) {
        return EMPTY;
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/graph`,
        {
          method: HTTPMethod.PATCH,
          body: JSON.stringify(body),
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
      );
    }),
  );

export const setNodeAsRootEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.setNodeAsRoot.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ payload, name }) => {
      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        GraphActions.setRootNodeId(payload),
      ];

      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) {
        return EMPTY;
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/graph`,
        {
          method: HTTPMethod.PATCH,
          body: JSON.stringify({
            root: payload,
          }),
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
      );
    }),
  );

export const updateNodeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.updateNode.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      elements: GraphSelectors.selectElements(state$.value),
    })),
    concatMap(({ payload, name, elements }) => {
      const targetNode = elements.find(el => el.data.id === payload.id);
      if (!targetNode) {
        return EMPTY;
      }
      const updatedNode = {
        data: merge({}, targetNode.data, payload),
        position: targetNode.position,
      } as PositionedElement<Node>;

      delete updatedNode.data.question;

      if (payload.questions) {
        updatedNode.data.questions = payload.questions;
      }

      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        GraphActions.updateElements([updatedNode]),
      ];

      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) {
        return EMPTY;
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/graph/nodes/${payload.id}`,
        {
          method: HTTPMethod.PUT,
          body: JSON.stringify(updatedNode),
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
      );
    }),
  );

export const createNodeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.createNode.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
    })),
    concatMap(({ payload, name }) => {
      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        GraphActions.addOrUpdateElements([payload]),
        GraphActions.setFocusNodeId(payload.data.id),
        UIActions.setIsNodeEditorOpen(true),
      ];

      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) {
        return EMPTY;
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/graph/nodes`,
        {
          method: HTTPMethod.POST,
          body: JSON.stringify(payload),
          headers: { [MindmapUrlHeaderName]: mindmapFolder },
        },
        state$,
        optimisticActions,
        [BuilderActions.createNodeSuccess()],
      );
    }),
  );

export const deleteNodeWithConnectedEdgesEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.deleteNodeWithConnectedEdges.match),
    map(({ payload }) => ({
      payload,
      elements: GraphSelectors.selectElements(state$.value),
    })),
    mergeMap(({ payload, elements }) => {
      const edges = elements.filter(el => (el.data as any).source) as Element<Edge>[];
      const connectedEdgeIds = edges
        .filter(edge => edge.data.source === payload || edge.data.target === payload)
        .map(e => e.data.id);

      return concat(
        of(UIActions.setIsNodeEditorOpen(false)),
        of(BuilderActions.deleteNode({ nodeId: payload, edgesIds: connectedEdgeIds })),
      );
    }),
  );

export const deleteNodeEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(BuilderActions.deleteNode.match),
    map(({ payload }) => ({
      payload,
      name: ApplicationSelectors.selectApplicationName(state$.value),
      elements: GraphSelectors.selectElements(state$.value),
    })),
    concatMap(({ payload, name }) => {
      const optimisticActions = [
        HistoryActions.setIsUndo(true),
        HistoryActions.setIsRedo(false),
        GraphActions.deleteElements([payload.nodeId, ...payload.edgesIds]),
      ];

      const mindmapFolder = ApplicationSelectors.selectMindmapFolder(state$.value);
      if (!mindmapFolder) {
        return EMPTY;
      }

      return handleRequest(
        `/api/mindmaps/${encodeURIComponent(name)}/graph/nodes/${payload.nodeId}`,
        { method: HTTPMethod.DELETE, headers: { [MindmapUrlHeaderName]: mindmapFolder } },
        state$,
        optimisticActions,
      );
    }),
  );
