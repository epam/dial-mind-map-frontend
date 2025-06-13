import { Core, EdgeCollection } from 'cytoscape';

import { Edge, Element } from '@/types/graph';

import { AnimationDurationMs } from '../../options';

export const showEdges = (cy: Core, currentEdges: EdgeCollection, newEdges: Element<Edge>[]) => {
  newEdges.forEach(newEdge => {
    if (!currentEdges.some(edge => edge.first().id() === newEdge.data.id)) {
      const sourceExists = cy.getElementById(newEdge.data.source).length > 0;
      const targetExists = cy.getElementById(newEdge.data.target).length > 0;

      if (sourceExists && targetExists) {
        cy.add(newEdge);
        const addedEdge = cy.getElementById(newEdge.data.id);
        addedEdge.animate({
          queue: false,
          duration: AnimationDurationMs,
        });
      }
    }
  });
};
