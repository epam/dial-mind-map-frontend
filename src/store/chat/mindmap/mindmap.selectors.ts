import { createSelector } from '@reduxjs/toolkit';

import { Edge } from '@/types/graph';
import { isNode } from '@/utils/app/graph/typeGuards';

import { ChatRootState } from '../index';
import { MindmapState } from './mindmap.types';

const rootSelector = (state: ChatRootState): MindmapState => state.mindmap;

export const selectGraphElements = createSelector([rootSelector], state => state.elements);

export const selectIsReady = createSelector([rootSelector], state => state.isReady);

export const selectFocusNodeId = createSelector([rootSelector], state => state.focusNodeId);

export const selectFocusNode = createSelector(
  [selectGraphElements, selectFocusNodeId],
  (elements, focusNodeId) => elements.find(el => isNode(el.data) && el.data.id === focusNodeId)?.data,
);

export const selectPreviousFocusNodeId = createSelector([rootSelector], state => state.previousNodeId);

export const selectVisitedNodes = createSelector([rootSelector], state => state.visitedNodes);

export const selectDepth = createSelector([rootSelector], state => state.depth);

export const selectUpdateSignal = createSelector([rootSelector], state => state.updateSignal);

export const selectIsGraphFetching = createSelector([rootSelector], state => state.isGraphFetching);

export const selectHasGeneratedEdges = createSelector([selectGraphElements], elements =>
  elements.some(el => (el.data as Edge).type === 'Generated'),
);

export const selectFallbackElements = createSelector([rootSelector], state => state.fallbackElements);

export const selectSequentialFetchFailures = createSelector([rootSelector], state => state.sequentialFetchFailures);

export const selectIsNotFound = createSelector([rootSelector], state => state.isNotFound);

export const selectIsRootNodeNotFound = createSelector([rootSelector], state => state.isRootNodeNotFound);

export const selectFullscreenReferences = createSelector([rootSelector], state => state.fullscreenReferences);

export const selectFullscreenInitialSlide = createSelector([rootSelector], state => state.fullscreenInitialSlide ?? 0);

export const selectActiveFullscreenReferenceId = createSelector(
  [rootSelector],
  state => state.activeFullscreenReferenceId,
);
