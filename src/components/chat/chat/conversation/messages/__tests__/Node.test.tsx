import { render, screen } from '@testing-library/react';

import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';

import { Node } from '../Node';

jest.mock('@/store/chat/hooks', () => ({
  useChatDispatch: jest.fn(),
  useChatSelector: jest.fn(),
}));

jest.mock('@tabler/icons-react', () => ({
  IconArrowBigLeftFilled: () => <svg data-testid="arrow-icon"></svg>,
}));

describe('Node', () => {
  const mockDispatch = jest.fn();
  const mockSelect = jest.fn();

  beforeEach(() => {
    (useChatDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useChatSelector as jest.Mock).mockReturnValue(mockSelect);
  });

  test('renders node with label', () => {
    render(
      <Node
        id="1"
        label="Test Node"
        color="#ff0000"
        textColor="#ff00ff"
        isVisited={false}
        isPrevious={false}
        size="default"
      />,
    );
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  test('applies correct styles for visited node', () => {
    render(
      <Node
        id="1"
        label="Visited Node"
        color="#ff0000"
        textColor="#ff00ff"
        isVisited={true}
        isPrevious={false}
        size="default"
      />,
    );
    expect(screen.getByText('Visited Node')).toHaveClass('opacity-60');
  });

  test('renders previous node with icon', () => {
    render(
      <Node
        id="1"
        label="Previous Node"
        color="#ff0000"
        textColor="#ff00ff"
        isVisited={false}
        isPrevious={true}
        size="default"
      />,
    );
    expect(screen.getByText('Previous Node')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument();
  });

  test('applies correct styles based on size prop', () => {
    const { rerender } = render(
      <Node
        id="1"
        label="Small Node"
        color="#ff0000"
        textColor="#ff00ff"
        isVisited={false}
        isPrevious={false}
        size="small"
      />,
    );
    expect(screen.getByTestId('chat-node')).toHaveClass('py-1 px-2 text-xs');

    rerender(
      <Node
        id="1"
        label="Default Node"
        color="#ff0000"
        textColor="#ff00ff"
        isVisited={false}
        isPrevious={false}
        size="default"
      />,
    );
    expect(screen.getByTestId('chat-node')).toHaveClass(
      'py-[6px] px-2 text-xs xl:text-sm xl:px-3 hover:outline hover:outline-[2.5px] hover:outline-offset-[-1px] rounded-lg xl:rounded-xl chat-conversation__message-node',
    );
  });

  test('renders node with default size when size prop is not provided', () => {
    render(
      <Node
        id="1"
        label="Default Size Node"
        color="#ff0000"
        textColor="#ff00ff"
        isVisited={false}
        isPrevious={false}
      />,
    );
    expect(screen.getByTestId('chat-node')).toHaveClass(
      'py-[6px] px-2 text-xs xl:text-sm xl:px-3 hover:outline hover:outline-[2.5px] hover:outline-offset-[-1px] rounded-lg xl:rounded-xl chat-conversation__message-node',
    );
  });
});
