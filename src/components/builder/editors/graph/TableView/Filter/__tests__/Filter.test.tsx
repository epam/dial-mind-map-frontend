import { Column } from '@tanstack/react-table';
import { fireEvent, render, screen } from '@testing-library/react';

import { Filter } from '../Filter';

const mockColumn = {
  setFilterValue: jest.fn(),
} as unknown as Column<any, string>;

const options = [
  { id: 'option1', label: 'Option 1' },
  { id: 'option2', label: 'Option 2' },
  { id: 'option3', label: 'Option 3' },
];

describe('Filter component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders filter icon and no badge by default', () => {
    render(<Filter column={mockColumn} options={options} onChange={jest.fn()} selectedFilters={[]} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument(); // badge indicator
  });

  test('shows all options and select all when tooltip is open', () => {
    render(<Filter column={mockColumn} options={options} onChange={jest.fn()} selectedFilters={[]} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/select all/i)).toBeInTheDocument();
    options.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  test('clicking select all selects all filters', () => {
    const handleChange = jest.fn();
    render(<Filter column={mockColumn} options={options} onChange={handleChange} selectedFilters={[]} />);
    fireEvent.click(screen.getByRole('button'));

    fireEvent.click(screen.getByText(/select all/i));
    expect(handleChange).toHaveBeenCalledWith(['option1', 'option2', 'option3']);
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(
      expect.arrayContaining([
        { id: 'option1', label: 'Option 1' },
        { id: 'option2', label: 'Option 2' },
        { id: 'option3', label: 'Option 3' },
      ]),
    );
  });

  test('clicking select all when all selected clears filters', () => {
    const handleChange = jest.fn();
    render(
      <Filter
        column={mockColumn}
        options={options}
        onChange={handleChange}
        selectedFilters={['option1', 'option2', 'option3']}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText(/select all/i));

    expect(handleChange).toHaveBeenCalledWith([]);
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(undefined);
  });

  test('clicking individual option toggles it', () => {
    const handleChange = jest.fn();
    render(<Filter column={mockColumn} options={options} onChange={handleChange} selectedFilters={['option1']} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText(/option 2/i));
    expect(handleChange).toHaveBeenCalledWith(['option1', 'option2']);
  });

  test('shows active filter badge when some (not all) filters are selected', () => {
    render(<Filter column={mockColumn} options={options} onChange={jest.fn()} selectedFilters={['option1']} />);
    expect(screen.getByTestId('bubble-badge')).toBeInTheDocument(); // badge bubble
  });
});
