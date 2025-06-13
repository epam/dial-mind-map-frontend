import { NodeCollection } from 'cytoscape';

import { Element, Node } from '@/types/graph';

import { AnimationDurationMs } from '../../options';

export const hideNodes = (currentNodes: NodeCollection, newNodes: Element<Node>[]) => {
  currentNodes.forEach(node => {
    const newNode = newNodes.find(n => n.data.id === node.id());
    if (newNode?.data.label && node.data('label') !== newNode?.data.label) {
      node.data('label', newNode.data.label);
      node.removeClass('previous');
    }

    //TODO: double check this
    let parentNode = node.connectedEdges().sources().first();

    if (parentNode && node.id() === parentNode.id()) {
      const childNodes = node.connectedEdges().targets();
      parentNode = childNodes.filter(n => newNodes.some(newNode => newNode.data.id === n.id()))?.[0];
    }

    if (!newNodes.some(nn => nn.data.id === node.id())) {
      if (parentNode) {
        node.style('z-index', -1);
        node.animate(
          {
            position: parentNode.position(),
            queue: false,
          },
          {
            queue: false,
            duration: AnimationDurationMs,
            complete: () => {
              node.remove();
            },
          },
        );
      } else {
        node.remove();
      }
    }
  });
};
