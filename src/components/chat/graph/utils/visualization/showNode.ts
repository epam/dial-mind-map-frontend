import { Core, NodeCollection } from 'cytoscape';

import { Edge, Element, Node } from '@/types/graph';

import { NewNodeColor } from '../../options';

export const showNodes = (
  cy: Core,
  newNodes: Element<Node>[],
  currentNodes: NodeCollection,
  newEdges: Element<Edge>[],
) => {
  newNodes.forEach(newNode => {
    if (!currentNodes.some(node => node.first().id() === newNode.data.id)) {
      let linkedNode = newEdges
        .filter(e => e.data.target === newNode.data.id)
        .map(e => cy.getElementById(e.data.source))
        .find(n => n.id());

      if (!linkedNode) {
        linkedNode = newEdges
          .filter(e => e.data.source === newNode.data.id)
          .map(e => cy.getElementById(e.data.target))
          .find(n => n.id());
      }

      const addedNode = cy.add(newNode);

      if (linkedNode) {
        addedNode.position(linkedNode.position());
      }

      addedNode.style({
        opacity: 1,
        'background-color': NewNodeColor,
        'border-color': NewNodeColor,
      });
    }
  });
};
