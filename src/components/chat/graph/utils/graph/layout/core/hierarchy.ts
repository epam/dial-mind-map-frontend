import { Core, NodeSingular, SingularElementArgument } from 'cytoscape';

/**
 * Build a level-1 hierarchy around the root and a mapping of children per parent.
 * Direction-agnostic: uses both in/out neighbors to be robust to graph semantics.
 */
export function buildHierarchy(cy: Core, rootId: string, previousNodeId?: string) {
  const isGroupPointer = (n: NodeSingular | SingularElementArgument) => String(n.id()).startsWith('#parent-');
  const uniq = <T>(arr: T[]) => Array.from(new Set(arr));

  const root = cy.$id(rootId);

  // Both outgoing targets and incoming sources (direction-agnostic)
  const neighborsBoth = (n: NodeSingular) => n.outgoers('edge').targets().union(n.incomers('edge').sources());

  // 1) Level-1 parents around the root
  let levelOneNodes = root
    .outgoers('edge')
    .targets()
    .union(root.incomers('edge').sources())
    .filter(n => !isGroupPointer(n) && n.id() !== rootId);

  // Optionally add previousNodeId into level-one (UX continuity)
  if (previousNodeId && levelOneNodes.empty()) {
    levelOneNodes = levelOneNodes.add(cy.$id(previousNodeId));
  } else if (previousNodeId && !levelOneNodes.map(n => n.id()).includes(previousNodeId)) {
    levelOneNodes = levelOneNodes.add(cy.$id(previousNodeId));
  }

  const levelOneIds = uniq(levelOneNodes.map(n => n.id())).sort((a, b) => a.localeCompare(b));
  const levelOneSet = new Set(levelOneIds);

  // 2) Build childrenByParent per level-one node
  const childrenByParent: Record<string, string[]> = {};
  levelOneNodes.forEach(p => {
    const neigh = neighborsBoth(p).filter(n => n.id() !== rootId && !isGroupPointer(n) && !levelOneSet.has(n.id()));
    const kids = uniq(neigh.map(n => n.id())).sort((a, b) => a.localeCompare(b));
    childrenByParent[p.id()] = kids;
  });

  // 3) Fallback: if level-one empty, put all non-root, non-group under root
  if (levelOneIds.length === 0) {
    const allKids = cy
      .nodes()
      .filter(n => n.id() !== rootId && !isGroupPointer(n))
      .map(n => n.id());
    if (allKids.length) {
      childrenByParent[rootId] = uniq(allKids);
      return { childrenByParent, levelOne: [rootId] };
    }
  }

  return { childrenByParent, levelOne: levelOneIds };
}
