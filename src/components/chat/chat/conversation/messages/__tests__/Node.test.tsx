import { fireEvent, render, screen } from '@testing-library/react';

import { useChatDispatch } from '@/store/chat/hooks';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';

import { Node } from '../Node';

jest.mock('@/store/chat/hooks', () => ({
  useChatDispatch: jest.fn(),
}));

jest.mock('@tabler/icons-react', () => ({
  IconArrowBigLeftFilled: () => <svg data-testid="arrow-icon"></svg>,
}));

describe('Node', () => {
  const mockDispatch = jest.fn();
  const mockCloseTooltip = jest.fn();

  beforeEach(() => {
    (useChatDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  test('renders node with label', () => {
    render(<Node id="1" label="Test Node" color="#ff0000" isVisited={false} isPrevious={false} size="default" />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  test('calls dispatch on click', () => {
    render(<Node id="1" label="Test Node" color="#ff0000" isVisited={false} isPrevious={false} size="default" />);
    fireEvent.click(screen.getByText('Test Node'));
    expect(mockDispatch).toHaveBeenCalledWith(
      MindmapActions.handleNavigation({ clickedNodeId: '1', shouldFetchGraph: true }),
    );
  });

  test('calls closeTooltip if provided', () => {
    render(
      <Node
        id="1"
        label="Test Node"
        color="#ff0000"
        isVisited={false}
        isPrevious={false}
        size="default"
        closeTooltip={mockCloseTooltip}
      />,
    );
    fireEvent.click(screen.getByText('Test Node'));
    expect(mockCloseTooltip).toHaveBeenCalled();
  });

  test('applies correct styles for visited node', () => {
    render(<Node id="1" label="Visited Node" color="#ff0000" isVisited={true} isPrevious={false} size="default" />);
    expect(screen.getByText('Visited Node')).toHaveClass('text-secondary');
  });

  test('renders previous node with icon', () => {
    render(<Node id="1" label="Previous Node" color="#ff0000" isVisited={false} isPrevious={true} size="default" />);
    expect(screen.getByText('Previous Node')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument();
  });

  test('applies correct styles based on size prop', () => {
    const { rerender } = render(
      <Node id="1" label="Small Node" color="#ff0000" isVisited={false} isPrevious={false} size="small" />,
    );
    expect(screen.getByText('Small Node')).toHaveClass('py-1 px-2 text-xs');

    rerender(<Node id="1" label="Default Node" color="#ff0000" isVisited={false} isPrevious={false} size="default" />);
    expect(screen.getByText('Default Node')).toHaveClass(
      'rounded-lg xl:rounded-xl flex items-center text-pretty text-controls-permanent hover:outline hover:outline-[2.5px] hover:outline-offset-[-1px] py-[6px] px-2 text-xs xl:text-sm xl:px-3',
    );
  });

  test('renders node with default size when size prop is not provided', () => {
    render(<Node id="1" label="Default Size Node" color="#ff0000" isVisited={false} isPrevious={false} />);
    expect(screen.getByText('Default Size Node')).toHaveClass(
      'rounded-lg xl:rounded-xl flex items-center text-pretty text-controls-permanent hover:outline hover:outline-[2.5px] hover:outline-offset-[-1px] py-[6px] px-2 text-xs xl:text-sm xl:px-3',
    );
  });
});
