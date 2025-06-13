import { render, screen } from '@testing-library/react';

import { LinkRenderer } from '../LinkRenderer';

describe('LinkRenderer Component', () => {
  test('renders an anchor tag for non-YouTube links', () => {
    render(<LinkRenderer href="https://example.com">Example</LinkRenderer>);

    const link = screen.getByRole('link', { name: /example/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('renders YouTube iframe for YouTube links', () => {
    render(<LinkRenderer href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);

    const iframe = screen.getByTitle('YouTube video player');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  test('does not render iframe for invalid YouTube URLs', () => {
    render(<LinkRenderer href="https://www.youtube.com/invalid" />);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/invalid');
  });
});
