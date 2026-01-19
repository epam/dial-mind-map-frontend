import { Core, NodeSingular } from 'cytoscape';

import { buildHierarchy } from '../hierarchy';

function makeNode(id: string, outgoing: NodeSingular[] = [], incoming: NodeSingular[] = []): any {
  const node = {
    _id: id,
    id() {
      return this._id;
    },
    outgoers: () => ({
      targets: () => ({
        union: (other: any) => {
          // union of targets plus other
          const arr = [...outgoing, ...(other._nodes ?? [])];
          return makeCollection(arr);
        },
      }),
    }),
    incomers: () => ({
      sources: () => ({
        union: (other: any) => {
          const arr = [...incoming, ...(other._nodes ?? [])];
          return makeCollection(arr);
        },
      }),
    }),
  };
  return node;
}

function makeCollection(nodes: NodeSingular[] = []): any {
  return {
    _nodes: nodes,
    map: (fn: (n: any) => any) => nodes.map(fn),
    filter: (fn: (n: any) => boolean) => makeCollection(nodes.filter(fn)),
    forEach: (fn: (n: any) => void) => nodes.forEach(fn),
    union: (other: any) => {
      const all = [...nodes, ...(other._nodes ?? [])];
      const unique = Array.from(new Set(all.map(n => n.id()))).map(
        id => [...nodes, ...(other._nodes ?? [])].find(n => n.id() === id)!,
      );
      return makeCollection(unique);
    },
    add: (other: any) => {
      const all = [...nodes, ...(other._nodes ?? [])];
      const unique = Array.from(new Set(all.map(n => n.id()))).map(id => all.find(n => n.id() === id)!);
      return makeCollection(unique);
    },
    empty: () => nodes.length === 0,
    length: nodes.length,
    [Symbol.iterator]: function* () {
      yield* nodes;
    },
  };
}

function makeCy(nodes: any[]): any {
  return {
    $id: (id: string) => {
      const found = nodes.find(n => n.id() === id);
      if (!found) {
        return makeCollection([]);
      }
      return {
        _nodes: [found],
        map: (fn: any) => [fn(found)],
        filter: (fn: any) => makeCollection(fn(found) ? [found] : []),
        outgoers: () => ({
          targets: () => makeCollection(found.outgoing || []),
        }),
        incomers: () => ({
          sources: () => makeCollection(found.incoming || []),
        }),
        union: (other: any) => makeCollection([found].concat(other._nodes ?? [])),
        empty: () => false,
        add: (other: any) => makeCollection([found].concat(other._nodes ?? [])),
      };
    },
    nodes: () => {
      return makeCollection(nodes);
    },
  };
}

describe('buildHierarchy', () => {
  test('simple case: root with two neighbors, no deeper children', () => {
    const n1 = makeNode('A');
    const n2 = makeNode('B');
    const root = makeNode('root');
    root.outgoing = [n1, n2];
    const cy = makeCy([root, n1, n2]);
    n1.outgoing = [];
    n1.incoming = [root];
    n2.outgoing = [];
    n2.incoming = [root];

    const result = buildHierarchy(cy as Core, 'root');

    expect(result.levelOne).toEqual(['A', 'B']);
    expect(result.childrenByParent).toEqual({
      A: [],
      B: [],
    });
  });

  test('excludes group pointers (ids starting with "#parent-")', () => {
    const good = makeNode('G1');
    const bad = makeNode('#parent-X');
    const root = makeNode('root');
    root.outgoing = [good, bad];
    good.incoming = [root];
    bad.incoming = [root];
    const cy = makeCy([root, good, bad]);

    const result = buildHierarchy(cy as Core, 'root');
    expect(result.levelOne).toEqual(['G1']);
    expect(result.childrenByParent).toEqual({ G1: [] });
  });

  test('include previousNodeId when no direct neighbors', () => {
    const root = makeNode('root');
    const prev = makeNode('prev');
    const cy = makeCy([root, prev]);
    const result = buildHierarchy(cy as Core, 'root', 'prev');

    expect(result.levelOne).toEqual(['prev']);
    expect(result.childrenByParent).toEqual({ prev: [] });
  });

  test('when levelOne empty, fallback: all non‑root non‑group become children of root', () => {
    const child1 = makeNode('C1');
    const child2 = makeNode('C2');
    const root = makeNode('root');
    const cy = makeCy([root, child1, child2]);
    const result = buildHierarchy(cy as Core, 'root');

    expect(result.levelOne).toEqual(['root']);
    expect(result.childrenByParent).toEqual({
      root: ['C1', 'C2'],
    });
  });
});
