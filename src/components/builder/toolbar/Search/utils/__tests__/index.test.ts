import { FuseResultMatch } from 'fuse.js';

import { getBestMatch, getHighlightedParts, getRelevantMatches } from '../';

const mockMatches: readonly FuseResultMatch[] = [
  {
    key: 'questions',
    indices: [
      [5, 10],
      [15, 20],
    ],
  },
  { key: 'details', indices: [[3, 8]] },
  { key: 'other', indices: [[2, 7]] },
];

describe('getBestMatch', () => {
  test('returns the best match based on score and position', () => {
    const result = getBestMatch(mockMatches);
    expect(result).not.toBeNull();
    expect(result?.match).toEqual(mockMatches[0]);
  });

  test('returns null when given an empty array', () => {
    expect(getBestMatch([])).toBeNull();
  });
});

describe('getRelevantMatches', () => {
  test('filters out non-relevant matches', () => {
    const result = getRelevantMatches(mockMatches);
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('questions');
    expect(result[1].key).toBe('details');
  });
});

describe('getHighlightedParts', () => {
  test('correctly extracts highlighted text with context', () => {
    const text = 'This is a long text with a keyword in the middle of it';
    const result = getHighlightedParts(text, [[27, 33]], 'keyword');

    expect(result.highlight).toBe('keyword');
    expect(result.before).toContain('long text');
    expect(result.after).toContain('in the middle');
  });
});
