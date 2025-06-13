import { FuseResultMatch } from 'fuse.js';

import { getBestMatch, getHighlightedParts, getRelevantMatches } from './utils';

interface HighlightedSearchTextProps {
  matches: readonly FuseResultMatch[];
  query: string;
}

export const HighlightedSearchText: React.FC<HighlightedSearchTextProps> = ({ matches, query }) => {
  if (!matches?.length) return null;

  const relevantMatches = getRelevantMatches(matches);
  if (!relevantMatches.length) return null;

  const bestMatch = getBestMatch(relevantMatches);
  if (!bestMatch) return null;

  const { value, indices } = bestMatch.match;
  if (!value || !indices.length) return null;

  const { before, highlight, after, showPrefixEllipsis, showSuffixEllipsis } = getHighlightedParts(
    value,
    indices,
    query,
  );

  return (
    <span className="break-words text-[12px] text-secondary">
      {showPrefixEllipsis && <span>...</span>}
      <span>{before}</span>
      <span className="text-accent-tertiary">{highlight}</span>
      <span>{after}</span>
      {showSuffixEllipsis && <span>...</span>}
    </span>
  );
};
