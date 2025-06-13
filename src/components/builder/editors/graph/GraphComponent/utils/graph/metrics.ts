import { Element, GraphElement, Node, PositionedElement } from '@/types/graph';
import { isNode } from '@/utils/app/graph/typeGuards';

export function getAvgEdgesPerNode(elements: Element<GraphElement>[]): number {
  const nodesCount = elements.filter(el => !(el.data as any).source).length;
  const edgesCount = elements.filter(el => (el.data as any).source).length;

  // Calculate average degree
  return nodesCount > 0 ? edgesCount / nodesCount : 0;
}

export function havePositions(elements: PositionedElement<GraphElement>[]): boolean {
  const nodes = elements.filter(el => isNode(el.data)) as PositionedElement<Node>[];
  return nodes.some(node => node.position);
}
