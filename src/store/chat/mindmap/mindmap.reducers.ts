/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ViewState } from '@/types/chat';
import { DocsReference, Element, GraphElement, NodeReference } from '@/types/graph';

import * as MindmapSelectors from './mindmap.selectors';
import { DepthType, MindmapState } from './mindmap.types';
export { MindmapSelectors };

export const MindmapInitialState: MindmapState = {
  elements: [],
  fallbackElements: [],
  previousNodeId: '',
  isReady: false,
  focusNodeId: '',
  visitedNodes: {},
  depth: 2,
  updateSignal: 0,
  isGraphFetching: false,
  sequentialFetchFailures: 0,
  isNotFound: false,
  isRootNodeNotFound: false,
  fullscreenReferences: null,
  fullscreenInitialSlide: null,
  activeFullscreenReferenceId: null,
  relayoutInProgress: false,
};

export const mindmapSlice = createSlice({
  name: 'graph',
  initialState: MindmapInitialState,
  reducers: {
    init: (state, { payload }: PayloadAction<MindmapState>) => {
      state.elements = payload.elements;
      state.focusNodeId = payload.focusNodeId;

      if (payload.elements.length > 0) {
        if (!payload.focusNodeId) {
          state.focusNodeId = payload.elements[0].data.id;
        }
      }

      if (Object.keys(payload.visitedNodes).length === 0) {
        const rootNodeId = payload.elements[0]?.data.id;
        state.visitedNodes = {
          [rootNodeId]: rootNodeId,
        };
      } else {
        state.visitedNodes = payload.visitedNodes;
      }

      state.depth = payload.depth;
      state.isReady = true;
      state.isNotFound = payload.isNotFound;
      state.isRootNodeNotFound = payload.isRootNodeNotFound;
    },
    fetchGraph: (state, { payload }: PayloadAction<ViewState | undefined>) => state,
    setGraphElements: (state, { payload }: PayloadAction<Element<GraphElement>[]>) => {
      state.elements = payload;
      state.updateSignal += 1;
    },
    setFallbackElements: state => {
      state.fallbackElements = state.elements;
      state.previousNodeId = state.focusNodeId;
    },
    fetchGraphFail: (
      state,
      {
        payload,
      }: PayloadAction<{ nodeId: string; previousNodeId: string; isNotFound?: boolean; isRootNodeNotFound?: boolean }>,
    ) => state,
    reset: state => {
      state.isReady = false;
    },
    handleNavigation: (state, { payload }: PayloadAction<{ clickedNodeId: string; shouldFetchGraph: boolean }>) =>
      state,
    setFocusNodeId: (state, { payload }: PayloadAction<string>) => {
      state.focusNodeId = payload;
    },
    addVisitedNodeId: (state, { payload }: PayloadAction<{ prevNodeId: string; newNodeId: string }>) => {
      if (!state.visitedNodes[payload.newNodeId] && state.visitedNodes[payload.prevNodeId] !== payload.newNodeId) {
        state.visitedNodes[payload.newNodeId] = payload.prevNodeId;
      }
    },
    setVisitedNodes: (state, { payload }: PayloadAction<Record<string, string>>) => {
      state.visitedNodes = payload;
    },
    updateElements: (
      state,
      {
        payload,
      }: PayloadAction<{
        elements: Element<GraphElement>[];
      }>,
    ) => {
      state.elements = payload.elements;
      state.updateSignal += 1;
    },
    upgradeElements: (
      state,
      _action: PayloadAction<{
        elements: Element<GraphElement>[];
      }>,
    ) => state,
    setDepth: (state, { payload }: PayloadAction<DepthType>) => {
      state.depth = payload;
    },
    addLinkedToFocusedElement: (
      state,
      action: PayloadAction<{
        id: string;
        label: string;
      }>,
    ) => state,
    setIsGraphFetching: (state, { payload }: PayloadAction<boolean>) => {
      state.isGraphFetching = payload;
    },
    increaseSequentialFetchFailures: state => {
      state.sequentialFetchFailures += 1;
    },
    resetSequentialFetchFailures: state => {
      state.sequentialFetchFailures = 0;
    },
    setIsReady: (state, { payload }: PayloadAction<boolean>) => {
      state.isReady = payload;
    },
    setIsMindmapNotFound: (state, { payload }: PayloadAction<boolean>) => {
      state.isNotFound = payload;
    },
    setIsNodeNotFound: (state, { payload }: PayloadAction<boolean>) => {
      state.isRootNodeNotFound = payload;
    },
    setFullscreenReferences: (state, { payload }: PayloadAction<Array<DocsReference | NodeReference> | null>) => {
      state.fullscreenReferences = payload;
    },
    setFullscreenInitialSlide: (state, { payload }: PayloadAction<number | null>) => {
      state.fullscreenInitialSlide = payload;
    },
    setActiveFullscreenReferenceId: (state, { payload }: PayloadAction<string | null>) => {
      state.activeFullscreenReferenceId = payload;
    },
    closeFullscreenReferences: state => {
      state.fullscreenReferences = null;
      state.fullscreenInitialSlide = null;
      state.activeFullscreenReferenceId = null;
    },
    setRelayoutInProgress: (state, { payload }: PayloadAction<boolean>) => {
      state.relayoutInProgress = payload;
    },
    setCompletionGraphResponseId: (state, { payload }: PayloadAction<string | undefined>) => {
      state.completionGraphResponseId = payload;
    },
  },
});

export const MindmapActions = mindmapSlice.actions;
