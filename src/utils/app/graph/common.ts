export const getEdgeId = (source: string, target: string): string => `E${source}_${target}`;

export function adjustVisitedNodes(
  visitedNodeIds: Record<string, string>,
  nodeToRemove: string,
): Record<string, string> {
  // Step 1: Get the previous node of the node to remove
  const previousNode = visitedNodeIds[nodeToRemove];

  // Step 2: Replace references to the node to remove with its previous node
  for (const [key, value] of Object.entries(visitedNodeIds)) {
    if (value === nodeToRemove) {
      visitedNodeIds[key] = previousNode;
    }
  }

  // Step 3: Remove the node to remove as a key
  delete visitedNodeIds[nodeToRemove];

  return visitedNodeIds;
}
