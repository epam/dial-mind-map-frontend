import { FuseResultMatch, RangeTuple } from 'fuse.js';

export const getBestMatch = (relevantMatches: readonly FuseResultMatch[]) =>
  relevantMatches.reduce<{ match: FuseResultMatch; score: number; firstIndex: number } | null>((best, match) => {
    const matchScore = match.indices.reduce((sum, [start, end]) => sum + (end - start), 0);
    const firstIndex = match.indices[0][0];

    if (!best || matchScore > best.score || (matchScore === best.score && firstIndex < best.firstIndex)) {
      return { match, score: matchScore, firstIndex };
    }

    return best;
  }, null);

const getBestMatchRange = (indices: readonly RangeTuple[], value: string, query: string) => {
  if (!indices.length) return [0, 0];
  const normQuery = query.toLowerCase();

  let bestStart = indices[0][0];
  let bestEnd = indices[0][1];

  for (const [start, end] of indices) {
    const matchedText = value.slice(start, end + 1).toLowerCase();
    if (matchedText.includes(normQuery)) {
      bestStart = start;
      bestEnd = end;
      break;
    }
    if (end - start > bestEnd - bestStart) {
      bestStart = start;
      bestEnd = end;
    }
  }

  return [bestStart, bestEnd];
};

export const getRelevantMatches = (matches: readonly FuseResultMatch[]) =>
  matches.filter(match => ['questions', 'details'].includes(match.key || ''));

export const getHighlightedParts = (value: string, indices: readonly RangeTuple[], query: string) => {
  const [start, end] = getBestMatchRange(indices, value, query);
  const contextPadding = 30;

  return {
    before: value.slice(Math.max(0, start - contextPadding), start),
    highlight: value.slice(start, end + 1),
    after: value.slice(end + 1, Math.min(value.length, end + contextPadding + 1)),
    showPrefixEllipsis: start > contextPadding,
    showSuffixEllipsis: end + contextPadding < value.length,
  };
};
