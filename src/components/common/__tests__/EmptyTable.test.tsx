import { render, screen } from '@testing-library/react';
import React from 'react';

import { EmptyTable } from '../EmptyTable';

describe('EmptyTable', () => {
  test('renders with default props', () => {
    render(<EmptyTable />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Sorry, we couldn’t find any results for your search.')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  test('renders with custom title and description', () => {
    render(<EmptyTable title="Custom Title" description="Custom Description" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });

  test('renders with custom icon', () => {
    const CustomIcon = () => <div data-testid="custom-icon">🔍</div>;
    render(<EmptyTable icon={<CustomIcon />} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
