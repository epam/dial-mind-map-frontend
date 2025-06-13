import { UnknownAction } from '@reduxjs/toolkit';
import isEqual from 'lodash-es/isEqual';
import uniqBy from 'lodash-es/uniqBy';
import xorWith from 'lodash-es/xorWith';
import { concat, Observable, of } from 'rxjs';

import { Graph, GraphElement, PositionedElement } from '@/types/graph';

import { GraphActions } from '../graph/graph.reducers';
import { UIActions } from '../ui/ui.reducers';

export const handleHistoryGraphResponse = (response: Graph, currentElements: PositionedElement<GraphElement>[]) => {
  const actions: Observable<UnknownAction>[] = [];

  const currentNodes = currentElements.filter(el => !('source' in el.data));
  const currentEdges = currentElements.filter(el => 'source' in el.data);

  const nodesDiff = uniqBy(
    xorWith(response.nodes, currentNodes, (a, b) => isEqual(a.data, b.data)),
    'data.id',
  );
  const edgesDiff = uniqBy(xorWith(response.edges, currentEdges, isEqual), 'data.id');

  if (nodesDiff.length === 1) {
    const newNode = response.nodes.find(n => n.data.id === nodesDiff[0].data.id);

    if (newNode) {
      actions.push(of(UIActions.setIsNodeEditorOpen(true)));
      actions.push(of(GraphActions.setFocusNodeId(newNode.data.id)));
    } else {
      actions.push(of(UIActions.setIsNodeEditorOpen(false)));
      actions.push(of(GraphActions.setFocusNodeId('')));
    }
  }

  if (edgesDiff.length === 1) {
    const newEdge = response.edges.find(n => n.data.id === edgesDiff[0].data.id);

    if (newEdge) {
      actions.push(of(GraphActions.setFocusEdgeId(newEdge.data.id)));
    } else {
      actions.push(of(GraphActions.setFocusEdgeId('')));
    }
  }

  actions.push(
    of(
      GraphActions.setElements({
        elements: [...response.nodes, ...response.edges],
      }),
    ),
  );

  return concat(...actions);
};
