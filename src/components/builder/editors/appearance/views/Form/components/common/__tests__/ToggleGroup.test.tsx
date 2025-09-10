import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ToggleGroup, ToggleGroupProps, ToggleOption } from '../ToggleGroup';

type TestValues = 'one' | 'two' | 'three';

const options: ToggleOption<TestValues>[] = [
  { label: 'First', value: 'one', className: 'opt-one', buttonActiveClassName: 'active-one' },
  { label: 'Second', value: 'two', className: 'opt-two', buttonActiveClassName: 'active-two' },
  { label: 'Third', value: 'three' },
];

describe('ToggleGroup', () => {
  const defaultProps: ToggleGroupProps<TestValues> = {
    options,
    value: 'two',
    onChange: jest.fn(),
    className: 'wrapper-class',
    buttonClassName: 'btn-base',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a wrapper with the combined className', () => {
    const { container } = render(<ToggleGroup {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('inline-flex', 'space-x-3', 'wrapper-class');
  });

  it('renders one button per option with correct labels', () => {
    render(<ToggleGroup {...defaultProps} />);
    options.forEach(opt => {
      expect(screen.getByRole('button', { name: opt.label })).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button')).toHaveLength(options.length);
  });

  it('applies active classes to the selected button', () => {
    render(<ToggleGroup {...defaultProps} />);
    const activeBtn = screen.getByRole('button', { name: 'Second' });
    expect(activeBtn).toHaveClass('border-accent-primary');
    expect(activeBtn).toHaveClass('active-two');
    expect(activeBtn).toHaveClass('btn-base');
  });

  it('applies inactive classes to non-selected buttons', () => {
    render(<ToggleGroup {...defaultProps} />);
    const inactiveBtns = options
      .filter(opt => opt.value !== defaultProps.value)
      .map(opt => screen.getByRole('button', { name: opt.label }));
    inactiveBtns.forEach(btn => {
      expect(btn).toHaveClass('border-primary');
      expect(btn).not.toHaveClass('border-accent-primary');
      expect(btn).toHaveClass('btn-base');
    });
  });

  it('merges option.className onto each button', () => {
    render(<ToggleGroup {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'First' })).toHaveClass('opt-one');
    expect(screen.getByRole('button', { name: 'Second' })).toHaveClass('opt-two');
    expect(screen.getByRole('button', { name: 'Third' })).not.toHaveClass('opt-one');
  });

  it('calls onChange with the clicked value when an inactive button is clicked', () => {
    render(<ToggleGroup {...defaultProps} />);
    const target = screen.getByRole('button', { name: 'First' });
    fireEvent.click(target);
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    expect(defaultProps.onChange).toHaveBeenCalledWith('one');
  });

  it('calls onChange when clicking the active button', () => {
    render(<ToggleGroup {...defaultProps} />);
    const active = screen.getByRole('button', { name: 'Second' });
    fireEvent.click(active);
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    expect(defaultProps.onChange).toHaveBeenCalledWith('two');
  });
});
