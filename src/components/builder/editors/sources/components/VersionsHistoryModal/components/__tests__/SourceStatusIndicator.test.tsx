import '@testing-library/jest-dom';

import { render, screen, within } from '@testing-library/react';
import React from 'react';

jest.mock('@/components/common/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

jest.mock('@/components/builder/common/Tooltip', () => ({
  __esModule: true,
  default: ({ tooltip, children }: { tooltip: string; children: React.ReactNode }) => (
    <div data-testid="tooltip" data-tooltip={tooltip}>
      {children}
    </div>
  ),
}));

jest.mock('@tabler/icons-react', () => ({
  IconPointFilled: ({ className, size }: { className?: string; size?: number }) => (
    <svg data-testid="icon" className={className} width={size} height={size} />
  ),
}));

import { SourceStatus } from '@/types/sources';

import { SourceStatusIndicator } from '../SourceStatusIndicator';

describe('SourceStatusIndicator', () => {
  it('renders Loader when status is undefined', () => {
    render(<SourceStatusIndicator />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders Loader when status is INPROGRESS', () => {
    render(<SourceStatusIndicator status={SourceStatus.INPROGRESS} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders failed icon with red color and shows tooltip text', () => {
    const message = 'Error occurred';
    render(<SourceStatusIndicator status={SourceStatus.FAILED} statusDescription={message} />);

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-tooltip', message);

    const icon = within(tooltip).getByTestId('icon');
    expect(icon).toHaveClass('text-error');
    expect(icon).toHaveAttribute('width', '20');
    expect(icon).toHaveAttribute('height', '20');
  });

  it('renders warning icon when status is REMOVED (default inGraph false)', () => {
    render(<SourceStatusIndicator status={SourceStatus.REMOVED} />);

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute(
      'data-tooltip',
      "Hasn't been applied to the graph. The knowledge base has been updated.",
    );

    const icon = within(tooltip).getByTestId('icon');
    expect(icon).toHaveClass('text-warning');
  });

  it('renders warning icon when inGraph is false even if status is INDEXED', () => {
    render(<SourceStatusIndicator status={SourceStatus.INDEXED} inGraph={false} />);

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute(
      'data-tooltip',
      "Hasn't been applied to the graph. The knowledge base has been updated.",
    );

    const icon = within(tooltip).getByTestId('icon');
    expect(icon).toHaveClass('text-warning');
  });

  it('renders null when status is INDEXED and inGraph is true', () => {
    const { container } = render(<SourceStatusIndicator status={SourceStatus.INDEXED} inGraph={true} />);

    expect(screen.queryByTestId('loader')).toBeNull();
    expect(screen.queryByTestId('tooltip')).toBeNull();
    expect(container.firstChild).toBeNull();
  });
});
