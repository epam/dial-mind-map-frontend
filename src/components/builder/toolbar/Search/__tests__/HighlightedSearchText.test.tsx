import { render, screen } from '@testing-library/react';
import { FuseResultMatch } from 'fuse.js';

import { HighlightedSearchText } from '../HighlightedSearchText';
import { getBestMatch, getHighlightedParts, getRelevantMatches } from '../utils';

jest.mock('../utils', () => ({
  getBestMatch: jest.fn(),
  getRelevantMatches: jest.fn(),
  getHighlightedParts: jest.fn(),
}));

describe('HighlightedSearchText', () => {
  it('should return null if matches are empty', () => {
    render(<HighlightedSearchText query={''} matches={[]} />);
    expect(screen.queryByRole('span')).not.toBeInTheDocument();
  });

  it('should return null if relevantMatches is empty', () => {
    (getRelevantMatches as jest.Mock).mockReturnValue([]);

    render(<HighlightedSearchText query={''} matches={[{ key: 'question', value: 'text', indices: [[0, 4]] }]} />);
    expect(screen.queryByRole('span')).not.toBeInTheDocument();
  });

  it('should return null if bestMatch is null', () => {
    (getRelevantMatches as jest.Mock).mockReturnValue([{ key: 'question', value: 'text', indices: [[0, 4]] }]);
    (getBestMatch as jest.Mock).mockReturnValue(null);

    render(<HighlightedSearchText query={''} matches={[{ key: 'question', value: 'text', indices: [[0, 4]] }]} />);
    expect(screen.queryByRole('span')).not.toBeInTheDocument();
  });

  it('should return null if bestMatch.match has no value', () => {
    (getRelevantMatches as jest.Mock).mockReturnValue([{ key: 'question', value: 'text', indices: [[0, 4]] }]);
    (getBestMatch as jest.Mock).mockReturnValue({ match: { key: 'question', value: '', indices: [] } });

    render(<HighlightedSearchText query={''} matches={[{ key: 'question', value: '', indices: [] }]} />);
    expect(screen.queryByRole('span')).not.toBeInTheDocument();
  });

  it('should return null if bestMatch.match has no indices', () => {
    (getRelevantMatches as jest.Mock).mockReturnValue([{ key: 'question', value: 'text', indices: [[0, 4]] }]);
    (getBestMatch as jest.Mock).mockReturnValue({ match: { key: 'question', value: 'text', indices: [] } });

    render(<HighlightedSearchText query={''} matches={[{ key: 'question', value: 'text', indices: [] }]} />);
    expect(screen.queryByRole('span')).not.toBeInTheDocument();
  });

  it('should render highlighted text correctly with prefix and suffix ellipsis', () => {
    const mockMatch: FuseResultMatch = { key: 'question', value: 'Highlighted example text', indices: [[0, 10]] };

    (getRelevantMatches as jest.Mock).mockReturnValue([mockMatch]);
    (getBestMatch as jest.Mock).mockReturnValue({ match: mockMatch });
    (getHighlightedParts as jest.Mock).mockReturnValue({
      before: 'Prefix ',
      highlight: 'Highlight',
      after: ' Suffix',
      showPrefixEllipsis: true,
      showSuffixEllipsis: true,
    });

    render(<HighlightedSearchText matches={[mockMatch]} query={''} />);
    expect(screen.getByText(/^Prefix$/)).toBeInTheDocument();
    expect(screen.getByText('Highlight')).toBeInTheDocument();
    expect(screen.getByText(/suffix/i)).toBeInTheDocument();

    expect(screen.getAllByText('...').length).toBe(2);
  });

  it('should render highlighted text without prefix ellipsis', () => {
    const mockMatch: FuseResultMatch = { key: 'details', value: 'Long text example', indices: [[5, 10]] };

    (getRelevantMatches as jest.Mock).mockReturnValue([mockMatch]);
    (getBestMatch as jest.Mock).mockReturnValue({ match: mockMatch });
    (getHighlightedParts as jest.Mock).mockReturnValue({
      before: 'Some text ',
      highlight: 'exampl',
      after: 'e for test',
      showPrefixEllipsis: false,
      showSuffixEllipsis: true,
    });

    render(<HighlightedSearchText matches={[mockMatch]} query={''} />);

    expect(screen.getByText(content => content.includes('Some text'))).toBeInTheDocument();
    expect(screen.getByText('exampl')).toBeInTheDocument();
    expect(screen.getByText('e for test')).toBeInTheDocument();

    expect(screen.getAllByText('...').length).toBe(1);
  });

  it('should not render anything when there are no matches', () => {
    render(<HighlightedSearchText matches={[]} query={''} />);
    expect(screen.queryByRole('span')).not.toBeInTheDocument();
  });
});
