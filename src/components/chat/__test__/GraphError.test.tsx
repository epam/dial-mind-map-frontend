import { render, screen } from '@testing-library/react';

import { GraphError } from '../GraphError';

jest.mock('@/icons/graph.svg', () => ({
  __esModule: true,
  default: ({ height, width }: { height: number; width: number }) => <svg role="img" height={height} width={width} />,
}));

describe('GraphError', () => {
  test('renders with default props', () => {
    render(<GraphError />);

    expect(screen.getByText(/mindmap is not available/i)).toBeInTheDocument();
    expect(screen.getByText(/please generate the graph/i)).toBeInTheDocument();

    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('height', '60');
    expect(icon).toHaveAttribute('width', '60');
  });

  test('renders with custom title, description, and iconSize', () => {
    render(<GraphError title="Custom Title" description="Custom Description" iconSize={100} />);

    expect(screen.getByText(/custom title/i)).toBeInTheDocument();
    expect(screen.getByText(/custom description/i)).toBeInTheDocument();

    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('height', '100');
    expect(icon).toHaveAttribute('width', '100');
  });
});
