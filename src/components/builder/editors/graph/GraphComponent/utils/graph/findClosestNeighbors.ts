import { Edge, EdgeDirectionType, Element, GraphElement, Node } from '@/types/graph';

/**
 * Finds all closest neighbors of the focused node.
 *
 * @param elements - The array of graph elements (nodes and edges).
 * @param focusedNodeId - The ID of the focused node.
 * @param type - The type of neighbors to return ('inbound', 'outbound', or undefined).
 * @returns An array of objects containing node info and edge info linking to the focused node.
 */
export function findClosestNeighbors(
  elements: Element<GraphElement>[],
  focusedNodeId: string,
  type?: EdgeDirectionType,
): { node: Node; edge: Edge; type: EdgeDirectionType }[] {
  // Separate nodes and edges
  const nodes = elements.filter(el => !(el.data as any).source) as Element<Node>[];
  const edges = elements.filter(el => (el.data as any).source) as Element<Edge>[];

  // Create a map for quick node lookup
  const nodeMap = new Map(nodes.map(node => [node.data.id, node]));

  // Find all edges connected to the focused node based on the type
  const connectedEdges = edges.filter(edge => {
    switch (type) {
      case EdgeDirectionType.Inbound:
        return edge.data.target === focusedNodeId;
      case EdgeDirectionType.Outbound:
        return edge.data.source === focusedNodeId;
      default:
        return edge.data.source === focusedNodeId || edge.data.target === focusedNodeId;
    }
  });

  // Set to track added node IDs to avoid duplicates
  const addedNodeIds = new Set<string>();

  // Collect the closest neighbors
  const closestNeighbors = connectedEdges
    .map(edge => {
      const isOutbound = edge.data.source === focusedNodeId;
      const neighborNodeId = isOutbound ? edge.data.target : edge.data.source;
      const neighborNode = nodeMap.get(neighborNodeId);
      if (neighborNode && !addedNodeIds.has(neighborNodeId)) {
        addedNodeIds.add(neighborNodeId);
        return {
          node: neighborNode.data,
          edge: edge.data,
          type: isOutbound ? EdgeDirectionType.Outbound : EdgeDirectionType.Inbound,
        };
      }
      return null;
    })
    .filter(Boolean) as { node: Node; edge: Edge; type: EdgeDirectionType }[];

  return closestNeighbors;
}
