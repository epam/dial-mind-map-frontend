import { render, screen } from '@testing-library/react';

import { DocsReference } from '@/types/graph';

import { MarkdownContent } from '../MarkdownContent';

jest.mock('remark-gfm', () => jest.fn());
jest.mock('remark-supersub', () => jest.fn());
jest.mock('rehype-raw', () => jest.fn());

jest.mock('@/components/chat/chat/conversation/messages/markdown/MemoizedReactMarkdown', () => ({
  MemoizedReactMarkdown: ({ children }: any) => <div data-testid="mock-markdown">{children}</div>,
}));

jest.mock('@/components/chat/chat/conversation/messages/markdown/elements/LinkRenderer', () => ({
  LinkRenderer: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe('MarkdownContent', () => {
  const reference: DocsReference = {
    content: '',
    doc_url: 'https://example.com',
    doc_id: '1',
    chunk_id: '1',
    doc_name: 'Example Document',
    doc_type: 'text',
    doc_content_type: 'text/plain',
    content_type: 'text/markdown',
  };

  test('renders Markdown content with plugins and custom class', () => {
    reference.content = 'Bold and _italic_';
    render(<MarkdownContent reference={reference} />);
    const container = screen.getByTestId('mock-markdown');
    expect(container).toBeInTheDocument();
    expect(container).toHaveTextContent(/bold/i);
    expect(container).toHaveTextContent(/italic/i);
  });
});
