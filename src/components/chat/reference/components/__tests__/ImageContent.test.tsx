import { render, screen } from '@testing-library/react';

import { useChatSelector } from '@/store/chat/hooks';
import { DocsReference } from '@/types/graph';

import { ImageContent } from '../ImageContent';

jest.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: any) => children,
  TransformComponent: ({ children, wrapperClass }: any) => <div className={wrapperClass}>{children}</div>,
}));

jest.mock('@/utils/app/file', () => ({
  constructPath: (...args: string[]) => args.join('/'),
}));

jest.mock('@/store/chat/hooks', () => ({
  useChatSelector: jest.fn(),
}));

describe('ImageContent Component', () => {
  const name = 'test-app';
  const reference: DocsReference = {
    content: 'image.jpg',
    doc_name: 'document.pdf',
    doc_url: 'doc.pdf',
    doc_id: '1',
    chunk_id: '1',
    doc_type: 'pdf',
    doc_content_type: 'application/pdf',
    content_type: 'image/jpeg',
    version: 1,
    source_name: 'source',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (useChatSelector as jest.Mock).mockReturnValue(name);
  });

  test('renders image with correct src and alt', () => {
    render(<ImageContent reference={reference} />);
    const image = screen.getByRole('img', { name: /document.pdf/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/api/mindmaps/test-app/image');
  });

  test('applies correct class when isFullscreenReference is true', () => {
    render(<ImageContent reference={reference} isFullscreenReference />);
    const image = screen.getByRole('img', { name: /document.pdf/i });
    expect(image).toHaveClass('w-full', 'max-h-full');
  });
});
