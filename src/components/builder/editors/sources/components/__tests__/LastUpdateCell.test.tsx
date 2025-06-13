import { render, screen } from '@testing-library/react';

import { LastUpdateCell } from '../LastUpdateCell';

describe('LastUpdateCell', () => {
  beforeAll(() => {
    jest.spyOn(Date.prototype, 'toLocaleString').mockImplementation(() => '04/15/2024, 14:30');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('renders mocked formatted date', () => {
    const timestamp = 1713191400;
    render(<LastUpdateCell date={timestamp} />);
    expect(screen.getByText('04/15/2024, 14:30')).toBeInTheDocument();
  });

  test('renders dash when date is undefined', () => {
    render(<LastUpdateCell date={undefined} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
