import { render, screen } from '@testing-library/react';

import { ErrorGraph } from '../ErrorGraph';

describe('ErrorGraph', () => {
  it('should render the error message and icon', () => {
    render(<ErrorGraph />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    expect(screen.getByText('Unable to load the graph')).toBeInTheDocument();

    expect(screen.getByText('Please contact the support team for assistance')).toBeInTheDocument();
  });
});
