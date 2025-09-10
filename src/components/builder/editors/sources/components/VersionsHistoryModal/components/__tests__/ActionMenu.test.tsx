import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SourcesActions } from '@/store/builder/sources/sources.reducers';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { SourceStatus, SourceType } from '@/types/sources';

import { ActionMenu } from '../ActionMenu';

jest.mock('@/components/builder/common/Tooltip', () => ({
  __esModule: true,
  default: ({ tooltip, children }: { tooltip: string; children: React.ReactNode }) => (
    <div data-testid="tooltip" data-tooltip={tooltip}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/builder/common/ContextMenu', () => ({
  __esModule: true,
  default: ({ menuItems }: { menuItems: any[] }) => (
    <div data-testid="context-menu">
      {menuItems.map(item => (
        <div key={item.dataQa} data-testid={item.dataQa} onClick={item.onClick}>
          {item.name}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@tabler/icons-react', () => ({
  IconRefresh: ({ className, size }: { className?: string; size?: number }) => (
    <svg data-testid="icon-refresh" className={className} width={size} height={size} />
  ),
  IconDownload: ({ className, size }: { className?: string; size?: number }) => (
    <svg data-testid="icon-download" className={className} width={size} height={size} />
  ),
  IconDots: ({ className, size }: { className?: string; size?: number }) => (
    <svg data-testid="icon-dots" className={className} width={size} height={size} />
  ),
}));

const mockDispatch = jest.fn();
jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: () => mockDispatch,
}));

describe('ActionMenu', () => {
  beforeEach(() => {
    mockDispatch.mockReset();
  });

  it('returns null when not hovered', () => {
    const { container } = render(
      <ActionMenu
        original={{
          id: '1',
          version: 1,
          status: SourceStatus.INDEXED,
          type: SourceType.LINK,
          url: 'http://example.com',
        }}
        hovered={false}
        handleAddVersion={jest.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders reindex and download for FAILED LINK and handles clicks', () => {
    const handleAddVersion = jest.fn();
    render(
      <ActionMenu
        original={{
          id: '1',
          version: 1,
          status: SourceStatus.FAILED,
          type: SourceType.LINK,
          url: 'http://example.com',
          name: 'Example',
        }}
        hovered
        handleAddVersion={handleAddVersion}
      />,
    );

    const reindexBtn = screen.getByTestId('reindex');
    const downloadBtn = screen.getByTestId('download');

    // Tooltip presence
    expect(screen.getAllByTestId('tooltip')).toHaveLength(2);

    // Click reindex
    fireEvent.click(reindexBtn);
    expect(handleAddVersion).toHaveBeenCalledWith({ link: 'http://example.com', sourceId: '1', versionId: 1 });

    // Click download
    fireEvent.click(downloadBtn);
    expect(mockDispatch).toHaveBeenCalledWith(
      SourcesActions.downloadSource({ sourceId: '1', versionId: 1, name: 'Example' }),
    );
  });

  it('on FAILED non-LINK triggers setSourceIdToAddVersion', () => {
    const handleAddVersion = jest.fn();
    render(
      <ActionMenu
        original={{
          id: '2',
          version: 2,
          status: SourceStatus.FAILED,
          type: SourceType.FILE,
          name: 'Test File',
          url: 'http://example.com/test-file',
        }}
        hovered
        handleAddVersion={handleAddVersion}
      />,
    );

    const reindexBtn = screen.getByTestId('reindex');
    fireEvent.click(reindexBtn);
    expect(mockDispatch).toHaveBeenCalledWith(UIActions.setSourceIdToAddVersion('2'));
  });

  it('renders only download for INDEXED when id and version present', () => {
    render(
      <ActionMenu
        original={{
          id: '3',
          version: 3,
          status: SourceStatus.INDEXED,
          type: SourceType.FILE,
          name: 'Test',
          url: 'http://example.com/test',
        }}
        hovered
        handleAddVersion={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('reindex')).toBeNull();
    const downloadBtn = screen.getByTestId('download');
    fireEvent.click(downloadBtn);
    expect(mockDispatch).toHaveBeenCalledWith(
      SourcesActions.downloadSource({ sourceId: '3', versionId: 3, name: 'Test' }),
    );
  });
});
