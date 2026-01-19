import { renderHook } from '@testing-library/react';
import { ChangeEvent } from 'react';

import { useBuilderDispatch } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { SourceType } from '@/types/sources';

import { sanitizeAndReportFiles } from '../../utils/files';
import { useSourceFileUpload } from '../useSourceFileUpload';

jest.mock('../../utils/files', () => ({
  sanitizeAndReportFiles: jest.fn(),
}));

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
}));

jest.mock('@epam/ai-dial-shared', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@/utils/app/file', () => ({
  constructPath: (folder: string, name: string) => `${folder}/${name}`,
  prepareFileName: (name: string) => name,
}));

const mockDispatch = jest.fn();
(useBuilderDispatch as jest.Mock).mockReturnValue(mockDispatch);

const createMockFile = (name: string, type = 'text/plain') => new File(['content'], name, { type });

describe('useSourceFileUpload', () => {
  const watchedSources = [{ type: SourceType.FILE, url: 'sources/existing.txt', name: 'existing.txt', id: '1' }] as any;
  const handleAddSource = jest.fn();

  const setup = () => renderHook(() => useSourceFileUpload({ watchedSources, handleAddSource }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error toast for duplicates files in different sources', async () => {
    const duplicateFile = createMockFile('existing.txt');
    (sanitizeAndReportFiles as jest.Mock).mockReturnValue([duplicateFile]);

    const { result } = setup();

    const input = {
      target: { files: [duplicateFile], value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>;

    await result.current.handleSelectFiles(input, '2');

    expect(mockDispatch).toHaveBeenCalledWith(
      UIActions.showErrorToast('The files existing.txt already exist in the list of sources'),
    );
    expect(handleAddSource).not.toHaveBeenCalled();
  });

  it('no error toast for duplicates files in the same source', async () => {
    const duplicateFile = createMockFile('existing.txt');
    (sanitizeAndReportFiles as jest.Mock).mockReturnValue([duplicateFile]);

    const { result } = setup();

    const input = {
      target: { files: [duplicateFile], value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>;

    await result.current.handleSelectFiles(input, '1');

    expect(mockDispatch).not.toHaveBeenCalledWith(
      UIActions.showErrorToast('The files existing.txt already exist in the list of sources'),
    );
    expect(handleAddSource).toHaveBeenCalled();
  });

  it('does nothing if no files are selected', async () => {
    const { result } = setup();
    (sanitizeAndReportFiles as jest.Mock).mockReturnValue([]);

    const input = {
      target: { files: null, value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>;

    await result.current.handleSelectFiles(input);

    expect(sanitizeAndReportFiles).toHaveBeenCalledWith(
      [],
      expect.any(Function),
      expect.anything(),
      expect.anything(),
      undefined,
      true,
    );
    expect(handleAddSource).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
