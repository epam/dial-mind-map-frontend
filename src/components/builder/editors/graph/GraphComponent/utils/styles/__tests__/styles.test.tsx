import { Core, NodeSingular } from 'cytoscape';

import { adjustFocusAndRootElementsStyles, getDarkenedNodeColor } from '../styles';

describe('getDarkenedNodeColor', () => {
  const mockNode = (id: string, color: string): NodeSingular => {
    return {
      id: () => id,
      style: function (...args: any[]): any {
        if (args.length === 0) {
          return { color };
        } else if (args.length === 1) {
          const arg = args[0];
          if (typeof arg === 'string') {
            return arg === 'color' ? color : '';
          } else if (typeof arg === 'object') {
            return this;
          }
        } else if (args.length === 2) {
          return this;
        }
      },
    } as NodeSingular;
  };

  it('returns a darkened color and caches it', () => {
    const node = mockNode('node1', 'rgb(100, 100, 100)') as NodeSingular;
    const result = getDarkenedNodeColor(node, 'color', 20);
    expect(result).toBe('rgb(80, 80, 80)');
  });

  it('retrieves color from cache if already computed', () => {
    const node = mockNode('node1', 'rgb(100, 100, 100)') as NodeSingular;
    getDarkenedNodeColor(node, 'color', 20);
    const cachedResult = getDarkenedNodeColor(node, 'color', 20);
    expect(cachedResult).toBe('rgb(80, 80, 80)');
  });

  it('does not modify color if percentage is 0', () => {
    const node = mockNode('node2', 'rgb(50, 50, 50)') as NodeSingular;
    const result = getDarkenedNodeColor(node, 'color', 0);
    expect(result).toBe('rgb(50, 50, 50)');
  });

  it('returns original color if input is invalid', () => {
    const node = mockNode('node3', 'invalid-color') as NodeSingular;
    const result = getDarkenedNodeColor(node, 'color', 20);
    expect(result).toBe('invalid-color');
  });

  it('defaults to 10% darkening when percentage is not provided', () => {
    const node = mockNode('node4', 'rgb(100, 100, 100)') as NodeSingular;
    const result = getDarkenedNodeColor(node, 'color', undefined as unknown as number);
    expect(result).toBe('rgb(90, 90, 90)');
  });
});

describe('adjustFocusAndRootElementsStyles', () => {
  let cyMock: jest.Mocked<Partial<Core>>;
  let nodesMock: jest.Mocked<any>;
  let edgesMock: jest.Mocked<any>;
  let elementMock: jest.Mocked<any>;

  beforeEach(() => {
    elementMock = {
      select: jest.fn(),
      addClass: jest.fn(),
      removeClass: jest.fn(),
    };

    nodesMock = {
      unselect: jest.fn(),
      removeClass: jest.fn(),
    };

    edgesMock = { unselect: jest.fn() };

    cyMock = {
      nodes: jest.fn(() => nodesMock),
      edges: jest.fn(() => edgesMock),
      getElementById: jest.fn(() => elementMock),
    };
  });

  it('selects the focus node and edge', () => {
    adjustFocusAndRootElementsStyles(cyMock as Core, 'node1', 'edge1', '');

    expect(cyMock.nodes).toHaveBeenCalled();
    expect(nodesMock.unselect).toHaveBeenCalled();
    expect(cyMock.edges).toHaveBeenCalled();
    expect(edgesMock.unselect).toHaveBeenCalled();
    expect(cyMock.getElementById).toHaveBeenCalledWith('node1');
    expect(elementMock.select).toHaveBeenCalled();
    expect(cyMock.getElementById).toHaveBeenCalledWith('edge1');
    expect(elementMock.select).toHaveBeenCalled();
  });

  it('sets the root node class if provided', () => {
    adjustFocusAndRootElementsStyles(cyMock as Core, 'node1', 'edge1', 'rootNode');

    expect(cyMock.nodes).toHaveBeenCalled();
    expect(nodesMock.removeClass).toHaveBeenCalledWith('root');
    expect(cyMock.getElementById).toHaveBeenCalledWith('rootNode');
    expect(elementMock.addClass).toHaveBeenCalledWith('root');
  });

  it('does not attempt to add root class if rootNodeId is empty', () => {
    adjustFocusAndRootElementsStyles(cyMock as Core, 'node1', 'edge1', '');

    expect(cyMock.getElementById).not.toHaveBeenCalledWith('');
    expect(elementMock.addClass).not.toHaveBeenCalled();
  });
});
