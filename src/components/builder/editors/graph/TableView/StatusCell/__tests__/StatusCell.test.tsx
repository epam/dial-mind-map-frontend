import { render, screen } from '@testing-library/react';

import { NodeStatusDict } from '@/constants/app';
import { NodeStatus } from '@/types/graph';

import StatusCell from '../StatusCell';

const renderComponent = (status: NodeStatus) => {
  render(<StatusCell status={status} />);
};

describe('StatusCell', () => {
  it('should not render when status is undefined', () => {
    render(<StatusCell />);
    expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
  });

  it('renders correctly for Draft status', () => {
    renderComponent(NodeStatus.Draft);
    expect(screen.getByText(NodeStatusDict[NodeStatus.Draft])).toBeInTheDocument();
    expect(screen.getByTestId('draft-icon').classList.contains('text-secondary'));
  });

  it('renders correctly for ReviewRequired status', () => {
    renderComponent(NodeStatus.ReviewRequired);
    expect(screen.getByText(NodeStatusDict[NodeStatus.ReviewRequired])).toBeInTheDocument();
    expect(screen.getByTestId('review-required-icon').classList.contains('stroke-warning'));
  });

  it('renders correctly for Reviewed status', () => {
    renderComponent(NodeStatus.Reviewed);
    expect(screen.getByText(NodeStatusDict[NodeStatus.Reviewed])).toBeInTheDocument();
    expect(screen.getByTestId('reviewed-icon').classList.contains('stroke-success'));
  });
});
