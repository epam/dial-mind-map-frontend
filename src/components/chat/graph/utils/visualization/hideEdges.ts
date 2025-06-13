import { EdgeCollection } from 'cytoscape';

import { Edge, Element } from '@/types/graph';

export const hideEdges = (currentEdges: EdgeCollection, newEdges: Element<Edge>[]) => {
  currentEdges.forEach(currentEdge => {
    if (!newEdges.some(e => e.data.id === currentEdge.id())) {
      currentEdge.remove();
    }
  });
};
