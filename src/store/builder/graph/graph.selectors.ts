import { createSelector } from '@reduxjs/toolkit';

import { Edge, Node } from '@/types/graph';

import { BuilderRootState } from '../index';
import { GraphState } from './graph.types';

const rootSelector = (state: BuilderRootState): GraphState => state.graph;

export const selectElements = createSelector([rootSelector], state => state.elements);

export const selectIsReady = createSelector([rootSelector], state => state.isReady);

export const selectRootNodeId = createSelector([rootSelector], state => state.rootNodeId);

export const selectFocusNodeId = createSelector([rootSelector], state => state.focusNodeId);

export const selectHighlightedNodeIds = createSelector([rootSelector], state => state.highlightedNodeIds);

export const selectFocusEdgeId = createSelector([rootSelector], state => state.focusEdgeId);

export const selectFocusNode = createSelector(
  [rootSelector],
  state => state.elements.find(el => el.data.id === state.focusNodeId)?.data as Node,
);

export const selectUpdateSignal = createSelector([rootSelector], state => state.updateSignal);

export const selectUpdateMode = createSelector([rootSelector], state => state.updateMode);

export const selectHasGeneratedEdges = createSelector([selectElements], elements =>
  elements.some(el => (el.data as Edge).type === 'Generated'),
);
