import { fireEvent, render, screen } from '@testing-library/react';

import Button from '../Button';

describe('Button component', () => {
  test('renders with default props', () => {
    render(<Button label="Click me" dataTestId="button" />);
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).toHaveAttribute('type', 'button');
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click me" onClick={handleClick} dataTestId="button" />);
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button label="Disabled" disabled onClick={handleClick} dataTestId="button" />);
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('renders with icon and default position (before)', () => {
    const Icon = () => <svg data-testid="icon" />;
    render(<Button icon={<Icon />} label="With Icon" dataTestId="button" />);
    const icon = screen.getByTestId('icon');
    // wrapper span should have margin-right when before
    expect(icon.parentElement).toHaveClass('mr-2');
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  test('positions icon after text when iconPosition="after"', () => {
    const Icon = () => <svg data-testid="icon" />;
    render(<Button icon={<Icon />} label="After Icon" iconPosition="after" dataTestId="button" />);
    const icon = screen.getByTestId('icon');
    // wrapper span should have margin-left when after
    expect(icon.parentElement).toHaveClass('ml-2');
  });

  test('applies variant classes correctly', () => {
    const { rerender } = render(<Button label="Primary" variant="primary" dataTestId="button" />);
    expect(screen.getByTestId('button')).toHaveClass('button-primary');

    rerender(<Button label="Secondary" variant="secondary" dataTestId="button" />);
    expect(screen.getByTestId('button')).toHaveClass('button-secondary');

    rerender(<Button label="Chat" variant="chat" dataTestId="button" />);
    expect(screen.getByTestId('button')).toHaveClass('button-chat');
  });

  test('applies noBorder correctly', () => {
    render(<Button label="No Border" variant="primary" noBorder dataTestId="button" />);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('border-0');
  });

  test('matches snapshot', () => {
    const { asFragment } = render(
      <Button
        label="Snapshot"
        icon={<span>*</span>}
        variant="primary"
        className="custom-class"
        noBorder
        iconPosition="after"
        dataTestId="button"
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
