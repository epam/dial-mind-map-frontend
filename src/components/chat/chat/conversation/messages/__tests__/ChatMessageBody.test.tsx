import { render, screen } from '@testing-library/react';

import { useChatSelector } from '@/store/chat/hooks';
import { MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { Message, Role } from '@/types/chat';
import { ColoredNode } from '@/types/graph';

import { ChatMessageBody } from '../ChatMessageBody';

jest.mock('@/store/chat/hooks', () => ({
  useChatSelector: jest.fn(),
}));

jest.mock('../markdown/MarkdownRenderer', () => {
  const MockMarkdownRenderer = () => <div data-testid="markdown-renderer"></div>;
  MockMarkdownRenderer.displayName = 'MarkdownRenderer';
  return MockMarkdownRenderer;
});

jest.mock('../Node', () => {
  const MockNode = ({ label }: { label: string }) => <div>{label}</div>;
  MockNode.displayName = 'Node';
  return { Node: MockNode };
});

jest.mock('@/components/builder/common/ErrorMessage', () => {
  const MockErrorMessage = ({ error }: { error: string }) => <div>{error}</div>;
  MockErrorMessage.displayName = 'ErrorMessage';
  return { ErrorMessage: MockErrorMessage };
});
describe('ChatMessageBody', () => {
  const mockMessage: Message = {
    id: '1',
    content: 'Test message',
    role: Role.User,
    references: {
      docs: [
        {
          doc_id: 'doc1',
          chunk_id: 'chunk1',
          doc_name: 'Doc 1',
          doc_type: 'pdf',
          doc_content_type: 'application/pdf',
          doc_url: 'https://example.com/doc1',
          content: 'Doc content',
          content_type: 'text/plain',
        },
      ],
      nodes: [
        {
          id: 'node1',
          label: 'Node 1',
          details: 'Details about Node 1',
          question: 'Question about Node 1',
        },
      ],
    },
    errorMessage: '',
  };

  const mockNodes: ColoredNode[] = [
    { id: 'node1', color: 'red', label: 'Node 1' },
    { id: 'node2', color: 'blue', label: 'Node 2' },
  ];

  beforeEach(() => {
    (useChatSelector as jest.Mock).mockImplementation(selector => {
      if (selector === MindmapSelectors.selectVisitedNodes) {
        return { node1: true };
      }
      if (selector === MindmapSelectors.selectFocusNodeId) {
        return 'node1';
      }
      return {};
    });
  });

  test('renders message content with MarkdownRenderer', () => {
    render(<ChatMessageBody message={mockMessage} isLastMessage={false} />);
    expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
  });

  test('renders error message if content is missing', () => {
    render(<ChatMessageBody message={{ ...mockMessage, content: '', errorMessage: 'Error!' }} isLastMessage={false} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  test('renders nodes if provided', () => {
    render(<ChatMessageBody message={mockMessage} nodes={mockNodes} isLastMessage={false} />);
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Node 2')).toBeInTheDocument();
  });
});
