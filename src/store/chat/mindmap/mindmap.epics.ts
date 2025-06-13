import { Action } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import isEqual from 'lodash-es/isEqual';
import { combineEpics } from 'redux-observable';
import {
  catchError,
  concat,
  EMPTY,
  endWith,
  filter,
  from,
  map,
  mergeMap,
  of,
  startWith,
  switchMap,
  throwError,
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { DeploymentIdHeaderName } from '@/constants/http';
import { Edge, Element, Graph, GraphElement, Node } from '@/types/graph';
import { HTTPMethod } from '@/types/http';
import { ChatRootEpic } from '@/types/store';
import { ToastType } from '@/types/toasts';
import { adjustVisitedNodes, getEdgeId } from '@/utils/app/graph/common';

import { ApplicationSelectors } from '../application/application.reducer';
import { ConversationActions, ConversationSelectors } from '../conversation/conversation.reducers';
import { ChatUIActions } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchChatUnauthorized } from '../utils/globalCatchUnauthorized';
import { MindmapActions, MindmapInitialState, MindmapSelectors } from './mindmap.reducers';

const resetEpic: ChatRootEpic = action$ =>
  action$.pipe(
    filter(MindmapActions.reset.match),
    switchMap(() => {
      return concat(
        of(MindmapActions.setFocusNodeId('')),
        of(MindmapActions.setVisitedNodes({})),
        of(MindmapActions.updateElements({ elements: [] })),
        of(MindmapActions.fetchGraph()),
      );
    }),
  );

const upgradeElements: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(MindmapActions.upgradeElements.match),
    map(({ payload }) => ({
      payload,
      elements: MindmapSelectors.selectGraphElements(state$.value),
    })),
    switchMap(({ payload, elements }) => {
      const updatedNode = payload.elements.find(
        el => !(el.data as Edge).source && (el.data as Node).label,
      ) as Element<Node>;
      if (!updatedNode) {
        return EMPTY;
      }

      const filteredElements = elements.reduce((acc, el) => {
        if (el.data.id === updatedNode.data.id) {
          const node = cloneDeep(el) as Element<Node>;
          node.data.label = updatedNode.data.label;
          acc.push(node);
        } else {
          acc.push(el);
        }
        return acc;
      }, [] as Element<GraphElement>[]);

      return of(
        MindmapActions.updateElements({
          elements: filteredElements,
        }),
      );
    }),
  );

const handleNavigationEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(MindmapActions.handleNavigation.match),
    map(({ payload }) => ({
      payload,
      focusNodeId: MindmapSelectors.selectFocusNodeId(state$.value),
      conversation: ConversationSelectors.selectConversation(state$.value),
    })),
    switchMap(({ payload, focusNodeId, conversation }) => {
      const visitedNodeIds = cloneDeep(conversation.customViewState.visitedNodeIds) ?? {};
      if (!visitedNodeIds[payload.clickedNodeId] && visitedNodeIds[focusNodeId] !== payload.clickedNodeId) {
        visitedNodeIds[payload.clickedNodeId] = focusNodeId;
      }

      const actionsToDispatch: Action[] = [
        MindmapActions.addVisitedNodeId({ newNodeId: payload.clickedNodeId, prevNodeId: focusNodeId }),
        MindmapActions.setFocusNodeId(payload.clickedNodeId),
        ConversationActions.updateConversation({
          values: {
            customViewState: {
              ...conversation.customViewState,
              focusNodeId: payload.clickedNodeId,
              visitedNodeIds,
            },
          },
        }),
      ];

      if (payload.shouldFetchGraph) {
        actionsToDispatch.push(MindmapActions.fetchGraph());
      }

      return from(actionsToDispatch);
    }),
  );

const fetchGraphEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(MindmapActions.fetchGraph.match),
    map(({ payload }) => ({
      payload,
      elements: MindmapSelectors.selectGraphElements(state$.value),
      depth: MindmapSelectors.selectDepth(state$.value),
      focusNodeId: MindmapSelectors.selectFocusNodeId(state$.value),
      visitedNodes: MindmapSelectors.selectVisitedNodes(state$.value),
      customViewState: ConversationSelectors.selectCustomViewState(state$.value),
      application: ApplicationSelectors.selectApplication(state$.value),
    })),
    mergeMap(({ payload, elements, depth, focusNodeId, visitedNodes, customViewState, application }) => {
      const customElements = !!payload ? payload.customElements : customViewState.customElements;
      const body: any = {
        depth,
        ...customElements,
      };

      const focusedNodeId = !!payload ? payload.focusNodeId : focusNodeId || customViewState.focusNodeId;
      if (focusedNodeId) {
        body.node = focusedNodeId;
      }

      const visitedNodeIds = !!payload
        ? payload.visitedNodeIds
        : Object.keys(visitedNodes).length === 0
          ? customViewState.visitedNodeIds
          : visitedNodes;
      const previousNodeId = visitedNodeIds[focusedNodeId] ?? null;
      if (previousNodeId && previousNodeId !== focusNodeId) {
        body['previous_node'] = previousNodeId;
      }
      if (
        focusedNodeId &&
        previousNodeId &&
        !elements.some((el: any) => el.data.target === focusedNodeId && el.data.source === previousNodeId)
      ) {
        body.edges = [
          ...(body.edges ?? []),
          {
            data: {
              id: getEdgeId(focusNodeId, previousNodeId),
              target: focusedNodeId,
              source: previousNodeId,
              type: 'Manual',
            },
          },
          {
            data: {
              id: getEdgeId(focusNodeId, previousNodeId),
              target: previousNodeId,
              source: focusedNodeId,
              type: 'Manual',
            },
          },
        ];
      }

      const requestBody = {
        messages: [],
        custom_fields: {
          configuration: {
            subgraph_request: body,
          },
        },
      };

      if (!application) {
        return throwError(() => new Error('Application is not available.'));
      }

      return fromFetch(`api/graph`, {
        method: HTTPMethod.POST,
        headers: {
          'Content-Type': 'application/json',
          [DeploymentIdHeaderName]: application.name ?? application.application ?? '',
        },
        body: JSON.stringify(requestBody),
      }).pipe(
        mergeMap(resp => checkForUnauthorized(resp)),
        mergeMap(resp => {
          if (resp.ok) {
            return from(resp.json());
          } else {
            return from(resp.json()).pipe(
              mergeMap((errorBody: any) => {
                const errorMessage = errorBody.error?.message || resp.statusText;
                return throwError(() => ({
                  ...errorBody,
                  status: resp.status,
                  statusText: errorMessage,
                }));
              }),
            );
          }
        }),
        mergeMap((response: Graph) => {
          if (elements.length === 0) {
            const savedFocusedNodeId = focusNodeId || customViewState.focusNodeId;
            const savedFocusedNode = response.nodes.find(node => node.data.id === savedFocusedNodeId);
            const newFocusedNodeId = savedFocusedNode ? savedFocusedNodeId : response.nodes[0].data.id;

            return of(
              MindmapActions.init({
                ...MindmapInitialState,
                elements: [...response.nodes, ...response.edges],
                isReady: true,
                focusNodeId: newFocusedNodeId,
                visitedNodes: customViewState.visitedNodeIds,
                isNotFound: false,
                isRootNodeNotFound: false,
              }),
            );
          } else {
            const actions: Action[] = [MindmapActions.resetSequentialFetchFailures()];

            const newElements = [...response.nodes, ...response.edges];
            const isGraphChanged = !isEqual(elements, newElements);

            if (isGraphChanged) {
              actions.push(
                MindmapActions.updateElements({
                  elements: newElements,
                }),
              );
            }

            if (!focusedNodeId) {
              actions.unshift(MindmapActions.setFocusNodeId(response.nodes[0].data.id));
            }

            return concat(actions);
          }
        }),
        globalCatchChatUnauthorized(),
        catchError((errorResponse: any) => {
          console.warn(errorResponse);
          const errorMessage = errorResponse.error?.message;
          const isMindmapNotFound = errorResponse.status === 404 && errorMessage === 'Not found mindmap';
          const isRootNodeNotFound =
            errorResponse.status === 404 && errorMessage === 'Not found node' && !focusedNodeId;
          const actions = [
            of(MindmapActions.increaseSequentialFetchFailures()),
            of(
              MindmapActions.fetchGraphFail({
                nodeId: focusedNodeId,
                previousNodeId,
                isNotFound: isMindmapNotFound,
                isRootNodeNotFound,
              }),
            ),
            isMindmapNotFound && of(MindmapActions.setIsMindmapNotFound(true)),
            isRootNodeNotFound && of(MindmapActions.setIsNodeNotFound(true)),
          ].filter(action => !!action);

          return concat(...actions);
        }),
        startWith(MindmapActions.setIsGraphFetching(true)),
        endWith(MindmapActions.setIsGraphFetching(false)),
      );
    }),
  );

const MaxGraphFetchRetries = 3;

const fetchGraphFailEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(MindmapActions.fetchGraphFail.match),
    map(({ payload }) => ({
      payload,
      elements: MindmapSelectors.selectGraphElements(state$.value),
      visitedNodes: MindmapSelectors.selectVisitedNodes(state$.value),
      customViewState: ConversationSelectors.selectCustomViewState(state$.value),
      sequentialFetchFailures: MindmapSelectors.selectSequentialFetchFailures(state$.value),
    })),
    switchMap(({ payload, elements, customViewState, visitedNodes, sequentialFetchFailures }) => {
      const errorMessage = 'Unable to navigate to the selected node. Please try again.';

      const notFoundNode = elements.find(el => el.data.id === payload.nodeId)?.data as Node;

      if (payload.isNotFound || payload.isRootNodeNotFound) {
        return EMPTY;
      }

      if (!payload.nodeId) {
        return of(ChatUIActions.showErrorToast(errorMessage));
      }

      const visitedNodeIds = cloneDeep(
        Object.keys(visitedNodes).length === 0 ? customViewState.visitedNodeIds : visitedNodes,
      );
      let filteredVisitedNodes = {};
      let newFocusNodeId = '';

      if (sequentialFetchFailures < MaxGraphFetchRetries) {
        filteredVisitedNodes = adjustVisitedNodes(visitedNodeIds, payload.nodeId);
        newFocusNodeId = payload.previousNodeId;
      }

      const newCustomViewState = {
        ...customViewState,
        focusNodeId: newFocusNodeId,
        visitedNodeIds: filteredVisitedNodes,
      };

      return concat(
        of(MindmapActions.setFocusNodeId(newFocusNodeId)),
        of(MindmapActions.setVisitedNodes(filteredVisitedNodes)),
        !notFoundNode
          ? of(ChatUIActions.showErrorToast(errorMessage))
          : of(
              ChatUIActions.showToast({
                type: ToastType.Info,
                message: 'This node is no longer available.',
              }),
            ),
        of(MindmapActions.fetchGraph(newCustomViewState)),
        of(
          ConversationActions.updateConversation({
            values: {
              customViewState: newCustomViewState,
            },
          }),
        ),
      );
    }),
  );

const addLinkedToFocusedElementEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(MindmapActions.addLinkedToFocusedElement.match),
    map(({ payload }) => ({
      payload,
      elements: MindmapSelectors.selectGraphElements(state$.value),
      focusNodeId: MindmapSelectors.selectFocusNodeId(state$.value),
      customViewState: ConversationSelectors.selectCustomViewState(state$.value),
    })),
    switchMap(({ payload, elements, focusNodeId, customViewState }) => {
      const { id, label } = payload;
      const parentId = focusNodeId;

      if (elements.some(m => m.data.id === id)) {
        return EMPTY;
      }

      const newNode = { data: { id, label } };
      const newEdge = { data: { id: getEdgeId(parentId, id), source: parentId, target: id } };

      return concat(
        of(
          MindmapActions.updateElements({
            elements: [...elements, newNode, newEdge],
          }),
        ),
        of(
          ConversationActions.updateConversation({
            values: {
              customViewState: {
                ...customViewState,
                customElements: {
                  nodes: customViewState.customElements.nodes,
                  edges: [...customViewState.customElements.edges, newEdge],
                },
              },
            },
          }),
        ),
      );
    }),
  );

export const MindmapEpics = combineEpics(
  resetEpic,
  fetchGraphEpic,
  fetchGraphFailEpic,
  upgradeElements,
  handleNavigationEpic,
  addLinkedToFocusedElementEpic,
);
