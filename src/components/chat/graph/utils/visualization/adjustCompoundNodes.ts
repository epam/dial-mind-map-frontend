import { Core } from 'cytoscape';

import { Element, Node } from '@/types/graph';

export const adjustCompoundNodes = (cy: Core, newNodes: Element<Node>[]) => {
  // Move nodes to the proper compound node
  cy.nodes().forEach(node => {
    const newNode = newNodes.find(nn => nn.data.id === node.id());
    // todo: double check this ? before .parent
    node.move({ parent: (newNode?.data as any)?.parent ?? null });
  });

  // Remove redundant compound nodes if they don't have any children
  cy.nodes().forEach(node => {
    if (node.id().startsWith('#parent-') && !newNodes.some(nn => (nn.data as any).parent === node.id())) {
      node.remove();
    }
  });
};
