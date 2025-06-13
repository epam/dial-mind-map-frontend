import { Edge, Element, GraphElement, Node } from '@/types/graph';
import { isEdge } from '@/utils/app/graph/typeGuards';

/**
 * Filters out edges that don't have a valid source or target node.
 *
 * @param elements - The array of graph elements (nodes and edges).
 * @returns An object containing two arrays: validElements and invalidElements.
 */
export function filterInvalidEdges(elements: Element<GraphElement>[]): {
  validElements: Element<GraphElement>[];
  invalidEdges: Element<GraphElement>[];
} {
  // Separate nodes and edges
  const nodes = elements.filter(el => !isEdge(el.data)) as Element<Node>[];
  const edges = elements.filter(el => isEdge(el.data)) as Element<Edge>[];

  // Create a set of valid node IDs
  const validNodeIds = new Set(nodes.map(node => node.data.id));

  // Filter edges to include only those with valid source and target nodes
  const validEdges: Element<Edge>[] = [];
  const invalidEdges: Element<Edge>[] = [];

  edges.forEach(edge => {
    if (validNodeIds.has(edge.data.source) && validNodeIds.has(edge.data.target)) {
      validEdges.push(edge);
    } else {
      invalidEdges.push(edge);
    }
  });

  // Return the combined array of valid nodes and edges, and the array of invalid edges
  return {
    validElements: [...nodes, ...validEdges],
    invalidEdges,
  };
}
