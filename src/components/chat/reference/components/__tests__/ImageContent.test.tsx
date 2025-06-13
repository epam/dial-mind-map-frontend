import { render, screen } from '@testing-library/react';

import { DeviceType } from '@/store/chat/ui/ui.reducers';
import { DocsReference } from '@/types/graph';

import { ImageContent } from '../ImageContent';

jest.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: any) => children,
  TransformComponent: ({ children, wrapperClass }: any) => <div className={wrapperClass}>{children}</div>,
}));

jest.mock('@/utils/app/file', () => ({
  constructPath: (...args: string[]) => args.join('/'),
}));

describe('ImageContent Component', () => {
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
  };
  const folderPath = 'folder';

  test('renders image with correct src and alt', () => {
    render(<ImageContent reference={reference} folderPath={folderPath} deviceType={DeviceType.Desktop} />);
    const image = screen.getByRole('img', { name: /document.pdf/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/api/folder/image.jpg');
  });

  test('applies correct class when isFullscreenReference is true', () => {
    render(
      <ImageContent
        reference={reference}
        folderPath={folderPath}
        isFullscreenReference
        deviceType={DeviceType.Desktop}
      />,
    );
    const image = screen.getByRole('img', { name: /document.pdf/i });
    expect(image).toHaveClass('w-full', 'max-h-full');
  });

  test('applies correct class when isFullscreenReference is false', () => {
    render(
      <ImageContent
        reference={reference}
        folderPath={folderPath}
        isFullscreenReference={false}
        deviceType={DeviceType.Desktop}
      />,
    );
    const image = screen.getByRole('img', { name: /document.pdf/i });
    expect(image).toHaveClass('h-[300px]');
  });
});
