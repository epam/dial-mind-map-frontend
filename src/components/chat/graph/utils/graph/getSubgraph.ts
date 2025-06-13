import { Edge, Element, GraphElement, Node } from '@/types/graph';
import { isEdge } from '@/utils/app/graph/typeGuards';

/**
 * Extracts a subgraph from a given set of graph elements (nodes and edges) starting from a specified node and within a specified depth.
 *
 * @param elements - The array of graph elements (nodes and edges).
 * @param focusedNodeId - The ID of the starting node for the subgraph.
 * @param depth - The maximum depth to traverse from the starting node.
 * @param maxNodes - The maximum number of nodes to include in the result.
 * @param previousNodeId - The ID of the previous node to allow reverse traversal (optional).
 * @returns An array of graph elements (nodes and edges) that form the subgraph.
 */
export function getSubgraph(
  elements: Element<GraphElement>[],
  focusedNodeId: string,
  depth: number,
  maxNodes: number,
  previousNodeId?: string,
): Element<GraphElement>[] {
  // Separate nodes and edges
  const nodes = elements.filter(el => !isEdge(el.data)) as Element<Node>[];
  const edges = elements.filter(el => isEdge(el.data)) as Element<Edge>[];

  // Create a map for quick node lookup
  const nodeMap = new Map(nodes.map(node => [node.data.id, node]));

  // Create adjacency list for edges (forward direction)
  const adjacencyList = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.data.source)) {
      adjacencyList.set(edge.data.source, []);
    }
    adjacencyList.get(edge.data.source)!.push(edge.data.target);
  });

  // Create adjacency list for edges (reverse direction)
  const reverseAdjacencyList = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!reverseAdjacencyList.has(edge.data.target)) {
      reverseAdjacencyList.set(edge.data.target, []);
    }
    reverseAdjacencyList.get(edge.data.target)!.push(edge.data.source);
  });

  // BFS to find nodes and edges within the specified depth
  const currentLevelQueue: Array<{
    id: string;
    currentDepth: number;
  }> = [];
  const nextLevelQueue: Array<{
    id: string;
    currentDepth: number;
  }> = [];
  const visitedNodes = new Set<string>();
  const resultNodes: Element<Node>[] = [];
  const resultEdges: Element<Edge>[] = [];
  const nodeDepths = new Map<string, number>();

  const requiredEdges: {
    source: string;
    target: string;
  }[] = [];

  // Map to keep track of the next neighbor to visit for each node
  const nextNeighborIndex = new Map<string, number>();

  // Add the root node to the result and mark it as visited
  visitedNodes.add(focusedNodeId);
  if (nodeMap.has(focusedNodeId)) {
    resultNodes.push(nodeMap.get(focusedNodeId)!);
  }
  nodeDepths.set(focusedNodeId, 0);

  // Add all neighbors of the root node to the current level queue
  if (adjacencyList.has(focusedNodeId)) {
    adjacencyList.get(focusedNodeId)!.forEach(target => {
      if (!visitedNodes.has(target)) {
        currentLevelQueue.push({ id: target, currentDepth: 1 });
        requiredEdges.push({
          source: focusedNodeId,
          target: target,
        });
      }
    });
  }

  // Find the optimal path to the previous node in the reverse direction
  let foundPathToPreviousNode: string[] | null = null;
  if (previousNodeId) {
    const reverseQueue: Array<{
      id: string;
      path: string[];
      currentDepth: number;
    }> = [{ id: focusedNodeId, path: [focusedNodeId], currentDepth: 0 }];
    const reverseVisitedNodes = new Set<string>([focusedNodeId]);

    while (reverseQueue.length > 0) {
      const { id, path, currentDepth } = reverseQueue.shift()!;

      if (currentDepth > depth) {
        continue;
      }

      if (path.includes(previousNodeId)) {
        foundPathToPreviousNode = path;
      }

      if (reverseAdjacencyList.has(id)) {
        reverseAdjacencyList.get(id)!.forEach(source => {
          if (!reverseVisitedNodes.has(source)) {
            reverseVisitedNodes.add(source);
            reverseQueue.push({ id: source, path: [...path, source], currentDepth: currentDepth + 1 });
          }
        });
      }
      if (adjacencyList.has(id)) {
        adjacencyList.get(id)!.forEach(target => {
          if (!reverseVisitedNodes.has(target)) {
            reverseVisitedNodes.add(target);
            reverseQueue.push({ id: target, path: [...path, target], currentDepth: currentDepth + 1 });
          }
        });
      }
    }

    if (foundPathToPreviousNode) {
      foundPathToPreviousNode.forEach((nodeId, index) => {
        if (nodeMap.has(nodeId) && !resultNodes.some(n => n.data.id === nodeId)) {
          const node = nodeMap.get(nodeId);
          resultNodes.push(node!);
          visitedNodes.add(nodeId);
          if (!nodeDepths.has(nodeId)) {
            nodeDepths.set(nodeId, index);
          }
        }
        if (index > 0 && foundPathToPreviousNode) {
          const source = foundPathToPreviousNode[index - 1];
          const target = nodeId;
          let edge = edges.find(e => e.data.source === target && e.data.target === source);
          if (!edge) {
            edge = edges.find(e => e.data.source === source && e.data.target === target);
          }
          if (edge) {
            resultEdges.push(edge);
          }
        }
      });
    }
  }

  while (currentLevelQueue.length > 0 && resultNodes.length < maxNodes) {
    while (currentLevelQueue.length > 0) {
      const { id, currentDepth } = currentLevelQueue.shift()!;

      if (currentDepth > depth) {
        continue;
      }

      if (!visitedNodes.has(id)) {
        visitedNodes.add(id);
        if (nodeMap.has(id) && !resultNodes.some(n => n.data.id === id)) {
          resultNodes.push(nodeMap.get(id)!);
        }
        nodeDepths.set(id, currentDepth);

        // Stop if we've reached the maximum number of nodes
        if (resultNodes.length >= maxNodes) {
          break;
        }
      }

      // Initialize the next neighbor index for the current node if not already set
      if (!nextNeighborIndex.has(id)) {
        nextNeighborIndex.set(id, 0);
      }

      // Get the next neighbor to visit for the current node
      const neighborIndex = nextNeighborIndex.get(id)!;

      // Explore child nodes
      if (adjacencyList.has(id) && neighborIndex < adjacencyList.get(id)!.length) {
        const target = adjacencyList.get(id)![neighborIndex];
        if (
          !visitedNodes.has(target) &&
          !currentLevelQueue.some(el => el.id === target) &&
          !nextLevelQueue.some(el => el.id === target)
        ) {
          nextLevelQueue.push({ id: target, currentDepth: currentDepth + 1 });
          requiredEdges.push({
            source: id,
            target: target,
          });
        }
        nextNeighborIndex.set(id, neighborIndex + 1);
      }

      // If all neighbors have been visited, remove the node from the nextNeighborIndex map
      if (!adjacencyList.has(id) || nextNeighborIndex.get(id)! >= adjacencyList.get(id)!.length) {
        nextNeighborIndex.delete(id);
      } else {
        // Re-add the current node to the current level queue to process the next neighbor in the next iteration
        currentLevelQueue.push({ id, currentDepth });
      }
    }

    // Move to the next level
    currentLevelQueue.push(...nextLevelQueue);
    nextLevelQueue.length = 0;
  }

  if (foundPathToPreviousNode) {
    // Add children of all nodes on the path and their children recursively if they fit within the depth
    foundPathToPreviousNode.forEach((nodeId, index) => {
      const nodeDepth = index;
      if (nodeDepth < depth && nodeId !== focusedNodeId) {
        const bfsQueue: Array<{ id: string; currentDepth: number }> = [{ id: nodeId, currentDepth: nodeDepth }];
        while (bfsQueue.length > 0) {
          const { id, currentDepth } = bfsQueue.shift()!;
          if (currentDepth >= depth || nodeId === focusedNodeId || resultNodes.length >= maxNodes) {
            continue;
          }

          if (adjacencyList.has(id)) {
            adjacencyList.get(id)!.forEach(target => {
              if (resultNodes.length < maxNodes && !visitedNodes.has(target)) {
                visitedNodes.add(target);
                const currentTargetDepth = currentDepth + 1;

                if (nodeMap.has(target) && !resultNodes.some(n => n.data.id === target)) {
                  resultNodes.push(nodeMap.get(target)!);

                  if (!nodeDepths.has(target)) {
                    nodeDepths.set(target, currentTargetDepth);
                  }
                }
                const edge = edges.find(e => e.data.source === id && e.data.target === target);
                if (edge) {
                  resultEdges.push(edge);
                }
                bfsQueue.push({ id: target, currentDepth: currentTargetDepth });
              }
            });
          }
        }
      }
    });
  }

  // Collect edges where both source and target nodes are within the depth limit
  edges.forEach(edge => {
    const sourceDepth = nodeDepths.get(edge.data.source);
    const targetDepth = nodeDepths.get(edge.data.target);

    if (
      sourceDepth !== undefined &&
      targetDepth !== undefined &&
      sourceDepth <= depth &&
      targetDepth <= depth &&
      sourceDepth !== targetDepth &&
      requiredEdges.some(e => e.source === edge.data.source && e.target === edge.data.target) &&
      !resultEdges.some(
        e => e.data.id === edge.data.id || (e.data.source === edge.data.target && e.data.target === edge.data.source),
      )
    ) {
      resultEdges.push(edge);
    }
  });

  return [...resultNodes, ...resultEdges];
}
