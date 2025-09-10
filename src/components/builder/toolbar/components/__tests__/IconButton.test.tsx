import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('../../../common/Tooltip', () => ({
  __esModule: true,
  default: ({ tooltip, children }: { tooltip: string; children: React.ReactNode }) => (
    <div data-tooltip={tooltip}>{children}</div>
  ),
}));

import { IconHeart } from '@tabler/icons-react';

import IconButton, { IconButtonProps } from '../IconButton';

describe('IconButton', () => {
  const defaultProps: IconButtonProps = {
    Icon: IconHeart,
    tooltip: 'Test Tooltip',
    onClick: jest.fn(),
    className: 'custom-class',
    dataQa: 'icon-button',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('default disabled prop is false when not provided', () => {
    render(<IconButton {...(defaultProps as any)} />);
    const button = screen.getByTestId('icon-button');
    expect(button).not.toBeDisabled();
  });

  test('renders the button with icon, custom class, and data-testid', () => {
    render(<IconButton {...(defaultProps as any)} />);

    const button = screen.getByTestId('icon-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('custom-class');

    const wrapper = button.parentElement as HTMLElement;
    expect(wrapper).toHaveAttribute('data-tooltip', 'Test Tooltip');
  });

  test('calls onClick when clicked and not disabled', async () => {
    const user = userEvent.setup();
    render(<IconButton {...(defaultProps as any)} />);

    const button = screen.getByTestId('icon-button');
    await user.click(button);
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    render(<IconButton {...(defaultProps as any)} disabled />);

    const button = screen.getByTestId('icon-button');
    expect(button).toBeDisabled();

    await user.click(button);
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  test('applies base styling classes', () => {
    render(<IconButton {...(defaultProps as any)} />);
    const button = screen.getByTestId('icon-button');

    expect(button).toHaveClass('h-[34px]');
    expect(button).toHaveClass('w-[34px]');
    expect(button).toHaveClass('rounded');
  });
});
