import { Edge, GraphElement, Node, NodeStatus, PositionedElement } from '@/types/graph';

export const isNode = (element: GraphElement | PositionedElement<GraphElement>): element is Node => 'label' in element;

export const isEdge = (element: GraphElement | PositionedElement<GraphElement>): element is Edge =>
  'source' in element && 'target' in element;

export function isNodeStatus(value: string): value is NodeStatus {
  return Object.values(NodeStatus).includes(value as NodeStatus);
}
