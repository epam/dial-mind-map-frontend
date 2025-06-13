import { fireEvent, render, screen } from '@testing-library/react';

import Checkbox from '../Checkbox';

describe('Checkbox component', () => {
  test('renders with label text', () => {
    render(<Checkbox>Accept terms</Checkbox>);
    expect(screen.getByText(/accept terms/i)).toBeInTheDocument();
  });

  test('calls onChange with toggled value when clicked', () => {
    const handleChange = jest.fn();
    render(
      <Checkbox checked={false} onChange={handleChange}>
        Toggle me
      </Checkbox>,
    );

    const customBox = screen.getByTestId('custom-checkbox');
    fireEvent.click(customBox);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  test('shows check icon when checked', () => {
    render(<Checkbox checked>Checked</Checkbox>);
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  test('shows indeterminate line when indeterminate', () => {
    render(<Checkbox indeterminate>Indeterminate</Checkbox>);
    expect(screen.getByTestId('indeterminate-mark')).toBeInTheDocument();
  });

  test('hidden input reflects checked state', () => {
    render(<Checkbox checked>Hidden input</Checkbox>);
    const input = screen.getByLabelText(/hidden input/i) as HTMLInputElement;
    expect(input.checked).toBe(true);
  });
});
