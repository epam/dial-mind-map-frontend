import { EdgeType } from '@/types/graph';

import { isEdge, isNode } from '../typeGuards';
describe('GraphElement type guards', () => {
  describe('isNode', () => {
    it('should return true for an object that is a Node', () => {
      const node = { id: '1', label: 'Node label', details: 'Some details' };
      expect(isNode(node)).toBe(true);
    });

    it('should return false for an object that is an Edge', () => {
      const edge = { id: '2', source: 'A', target: 'B', type: EdgeType.Init };
      expect(isNode(edge)).toBe(false);
    });
  });

  describe('isEdge', () => {
    it('should return true for an object that is an Edge', () => {
      const edge = { id: '2', source: 'A', target: 'B', type: EdgeType.Init };
      expect(isEdge(edge)).toBe(true);
    });

    it('should return false for an object that is a Node', () => {
      const node = { id: '1', label: 'Node label', details: 'Some details' };
      expect(isEdge(node)).toBe(false);
    });
  });
});
