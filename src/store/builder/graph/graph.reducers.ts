/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import isEqual from 'lodash-es/isEqual';

import { Element, GraphElement } from '@/types/graph';

import * as GraphSelectors from './graph.selectors';
import { GraphState, UpdateMode } from './graph.types';
export { GraphSelectors as GraphSelectors };

export const GraphInitialState: GraphState = {
  elements: [],
  isReady: false,
  rootNodeId: '',
  focusNodeId: '',
  focusEdgeId: '',
  highlightedNodeIds: [],
  updateSignal: 0,
  updateMode: UpdateMode.None,
};

export const graphSlice = createSlice({
  name: 'graph',
  initialState: GraphInitialState,
  reducers: {
    init: (state, { payload }: PayloadAction<GraphState>) => {
      state.elements = payload.elements;

      if (payload.focusNodeId) {
        state.focusNodeId = payload.focusNodeId;
      }

      state.rootNodeId = payload.rootNodeId;
      state.isReady = true;
    },
    setRootNodeId: (state, { payload }: PayloadAction<string>) => {
      state.rootNodeId = payload;
      state.updateMode = UpdateMode.Refresh;
      state.updateSignal += 1;
    },
    setFocusNodeId: (state, { payload }: PayloadAction<string>) => {
      state.focusNodeId = payload;
      state.focusEdgeId = '';
    },
    setHighlightedNodeIds: (state, { payload }: PayloadAction<string[]>) => {
      state.highlightedNodeIds = payload;
    },
    setFocusEdgeId: (state, { payload }: PayloadAction<string>) => {
      state.focusEdgeId = payload;
      state.focusNodeId = '';
    },
    setElements: (
      state,
      {
        payload,
      }: PayloadAction<{
        elements: Element<GraphElement>[];
        skipLayout?: boolean;
      }>,
    ) => {
      state.elements = payload.elements;
      if (!payload.skipLayout) {
        state.updateSignal += 1;
        state.updateMode = UpdateMode.Refresh;
      }
    },
    deleteElements: (state, { payload }: PayloadAction<string[]>) => {
      const filteredElements = state.elements.filter(el => !payload.includes(el.data.id));
      state.elements = filteredElements;

      state.updateSignal += 1;
      state.updateMode = UpdateMode.Refresh;
    },
    addOrUpdateElements: (state, { payload }: PayloadAction<Element<GraphElement>[]>) => state,
    updateElements: (state, { payload }: PayloadAction<Element<GraphElement>[]>) => {
      let updated = false;

      payload.forEach(newElement => {
        const index = state.elements.findIndex(el => el.data.id === newElement.data.id);
        if (index !== -1 && !isEqual(state.elements[index], newElement)) {
          state.elements[index] = cloneDeep(newElement);
          updated = true;
        }
      });

      if (updated) {
        state.updateSignal += 1;
        state.updateMode = UpdateMode.Refresh;
      }
    },
    relayout: state => {
      state.updateSignal += 1;
      state.updateMode = UpdateMode.Relayout;
    },
    refresh: state => {
      state.updateSignal += 1;
      state.updateMode = UpdateMode.Refresh;
    },
    setGraphReady: (state, { payload }: PayloadAction<boolean>) => {
      state.isReady = payload;
    },
  },
});

export const GraphActions = graphSlice.actions;
