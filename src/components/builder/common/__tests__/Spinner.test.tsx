import { render, screen } from '@testing-library/react';

import { Spinner } from '../../../common/Spinner';

jest.mock('@/icons/loader.svg', () => ({
  __esModule: true,
  default: (props: any) => <svg data-testid={props['data-qa']} {...props} />,
}));

describe('Spinner', () => {
  test('renders with default props', () => {
    render(<Spinner />);
    const spinner = screen.getByTestId('message-input-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('width', '16');
    expect(spinner).toHaveAttribute('height', '16');
    expect(spinner).toHaveClass('animate-spin-steps');
  });

  test('renders with custom size', () => {
    render(<Spinner size={32} />);
    const spinner = screen.getByTestId('message-input-spinner');
    expect(spinner).toHaveAttribute('width', '32');
    expect(spinner).toHaveAttribute('height', '32');
  });

  test('applies custom className', () => {
    render(<Spinner className="custom-class" />);
    const spinner = screen.getByTestId('message-input-spinner');
    expect(spinner).toHaveClass('custom-class');
  });

  test('uses custom dataQa attribute', () => {
    render(<Spinner dataQa="custom-spinner" />);
    expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
  });
});
