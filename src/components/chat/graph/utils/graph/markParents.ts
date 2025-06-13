import { Edge, Element, GraphElement, Node } from '@/types/graph';

export function markParents(elements: Element<GraphElement>[], focusedNodeId: string) {
  // Separate nodes and edges
  const nodes = elements.filter(el => !(el.data as any).source) as Element<Node>[];
  const edges = elements.filter(el => (el.data as any).source) as Element<Edge>[];

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

  // Function to mark a branch with a specific parent label
  const markBranch = (startNodeId: string, parentLabel: string) => {
    const queue = [startNodeId];
    const visitedNodes = new Set();

    while (queue.length > 0) {
      const currentNodeId = queue.shift();

      if (currentNodeId && !visitedNodes.has(currentNodeId)) {
        visitedNodes.add(currentNodeId);

        // Mark the current node with the parent label
        if (nodeMap.has(currentNodeId)) {
          (nodeMap.get(currentNodeId)!.data as any).parent = parentLabel;
        }

        // Explore child nodes
        if (adjacencyList.has(currentNodeId)) {
          adjacencyList.get(currentNodeId)!.forEach(target => {
            if (!visitedNodes.has(target)) {
              queue.push(target);
            }
          });
        }
      }
    }
  };

  // Track parent labels
  const parentLabels = new Set();

  // Mark all branches of the focused node
  if (adjacencyList.has(focusedNodeId)) {
    adjacencyList.get(focusedNodeId)!.forEach((childId, index) => {
      const parentLabel = `#parent-${index + 1}`;
      parentLabels.add(parentLabel);
      markBranch(childId, parentLabel);
    });
  }

  // Function to mark all ancestors and their branches
  const markAncestors = (nodeId: string, parentLabel: string) => {
    if (nodeMap.has(nodeId)) {
      (nodeMap.get(nodeId)!.data as any).parent = parentLabel;
    }

    if (adjacencyList.has(nodeId)) {
      adjacencyList.get(nodeId)!.forEach(childId => {
        if (childId !== nodeId && nodeMap.has(childId)) {
          (nodeMap.get(childId)!.data as any).parent = parentLabel;
        }
      });
    }
  };

  // Mark all parents branches
  if (reverseAdjacencyList.has(focusedNodeId)) {
    reverseAdjacencyList.get(focusedNodeId)!.forEach((childId, index) => {
      const parentLabel = `#parent-p${index + 1}`;
      parentLabels.add(parentLabel);
      markAncestors(childId, parentLabel);
    });
  }

  // Make sure that the focused node doesn't have any mark
  if (nodeMap.has(focusedNodeId)) {
    (nodeMap.get(focusedNodeId)!.data as any).parent = undefined;
  }

  // Create a new array with updated nodes and original edges
  const updatedNodes = Array.from(nodeMap.values());
  const updatedElements = [...updatedNodes, ...edges];

  // Last check and mark losted nodes
  const unmarked = updatedNodes.filter(node => !(node.data as any).parent && node.data.id !== focusedNodeId);
  unmarked.forEach(node => {
    const edge = edges.find(e => e.data.source === node.data.id);
    if (edge) {
      const relativeNode = nodeMap.get(edge.data.target);
      if ((relativeNode?.data as any).parent) {
        (node.data as any).parent = (relativeNode?.data as any).parent;
      }
    }
  });

  // Add label elements for each parent label that is used
  parentLabels.forEach(label => {
    const isLabelUsed = updatedNodes.some(node => (node.data as any).parent === label);
    if (isLabelUsed) {
      updatedElements.unshift({ data: { id: label, label: label } as any });
    }
  });

  return updatedElements;
}
