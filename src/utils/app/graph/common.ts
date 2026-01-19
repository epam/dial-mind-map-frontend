export const getEdgeId = (source: string, target: string): string => `E${source}_${target}`;

/**
 * Removes a node from the visited map.
 * Re-links all nodes pointing to `nodeId` to point to its previous node instead.
 */
export function removeVisitedNode(visited: Record<string, string>, nodeId: string): Record<string, string> {
  const previousNode = visited[nodeId];

  // Redirect all references from nodeId → previousNode
  for (const [key, value] of Object.entries(visited)) {
    if (value === nodeId) {
      visited[key] = previousNode;
    }
  }

  delete visited[nodeId];
  return visited;
}

/**
 * Replaces one node with another in the visited map.
 * - Moves incoming references from oldNode → newNode.
 * - Moves outgoing reference (if exists) oldNode → newNode.
 * - Removes oldNode key and inserts newNode key.
 */
export function replaceVisitedNode(
  visited: Record<string, string>,
  oldNode: string,
  newNode: string,
): Record<string, string> {
  const previousNode = visited[oldNode];

  // Redirect all references pointing to oldNode → newNode
  for (const [key, value] of Object.entries(visited)) {
    if (value === oldNode) {
      visited[key] = newNode;
    }
  }

  // Replace the oldNode key with newNode key preserving "previous"
  if (previousNode !== undefined) {
    visited[newNode] = previousNode;
  }

  delete visited[oldNode];
  return visited;
}
