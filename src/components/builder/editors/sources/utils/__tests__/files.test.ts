jest.mock('@/utils/app/file', () => ({
  __esModule: true,
  getFilesWithInvalidFileSize: jest.fn(),
  getFilesWithInvalidFileType: jest.fn(),
  getFilesWithInvalidFileName: jest.fn(),
  notAllowedSymbols: '@#%',
}));

import bytes from 'bytes';

import { UIActions } from '@/store/builder/ui/ui.reducers';
import * as fileUtils from '@/utils/app/file';

import { sanitizeAndReportFiles } from '../files';

describe('sanitizeAndReportFiles', () => {
  const dispatch = jest.fn();
  const createFile = (name: string, type: string = 'image/png', size: number = 1000): File => {
    const content = new Array(size).fill('a').join('');
    return new File([content], name, { type });
  };

  const maxSize = 1024 * 1024;
  const allowedTypes = ['image/png', 'image/jpeg'];

  beforeEach(() => {
    jest.clearAllMocks();

    (fileUtils.getFilesWithInvalidFileSize as jest.Mock).mockReturnValue([]);
    (fileUtils.getFilesWithInvalidFileType as jest.Mock).mockReturnValue([]);
    (fileUtils.getFilesWithInvalidFileName as jest.Mock).mockReturnValue({
      filesWithNotAllowedSymbols: [],
      filesWithDotInTheEnd: [],
    });
  });

  it('should return valid files and not call dispatch for valid inputs', () => {
    const files = [createFile('valid.png')];

    const result = sanitizeAndReportFiles(files, dispatch, allowedTypes, maxSize);

    expect(result).toEqual(files);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('should filter out files with invalid size and show toast', () => {
    const invalidFile = createFile('large.png');
    (fileUtils.getFilesWithInvalidFileSize as jest.Mock).mockReturnValue([invalidFile]);

    const result = sanitizeAndReportFiles([invalidFile], dispatch, allowedTypes, maxSize);

    expect(result).toEqual([]);
    expect(dispatch).toHaveBeenCalledWith(
      UIActions.showErrorToast(
        `Max file size up to ${bytes.format(maxSize, { unitSeparator: ' ' })}. Next files haven't been uploaded: large.png`,
      ),
    );
  });

  it('should filter out files with invalid type and show toast', () => {
    const invalidFile = createFile('bad.exe', 'application/exe');
    (fileUtils.getFilesWithInvalidFileType as jest.Mock).mockReturnValue([invalidFile]);

    const result = sanitizeAndReportFiles([invalidFile], dispatch, allowedTypes, maxSize);

    expect(result).toEqual([]);
    expect(dispatch).toHaveBeenCalledWith(
      UIActions.showErrorToast(`You've trying to upload files with incorrect type: bad.exe`),
    );
  });

  it('should show separate toast if only not allowed symbols in name', () => {
    const badNameFile = createFile('bad@name.png');

    (fileUtils.getFilesWithInvalidFileName as jest.Mock).mockReturnValue({
      filesWithNotAllowedSymbols: [badNameFile],
      filesWithDotInTheEnd: [],
    });

    const result = sanitizeAndReportFiles([badNameFile], dispatch, allowedTypes, maxSize);

    expect(result).toEqual([]);
    expect(dispatch).toHaveBeenCalledWith(
      UIActions.showErrorToast(
        `The symbols @#% are not allowed in file name. Please rename or delete them from uploading files list: bad@name.png`,
      ),
    );
  });

  it('should show separate toast if only dot at the end in name', () => {
    const dotEndFile = createFile('dotend.');

    (fileUtils.getFilesWithInvalidFileName as jest.Mock).mockReturnValue({
      filesWithNotAllowedSymbols: [],
      filesWithDotInTheEnd: [dotEndFile],
    });

    const result = sanitizeAndReportFiles([dotEndFile], dispatch, allowedTypes, maxSize);

    expect(result).toEqual([]);
    expect(dispatch).toHaveBeenCalledWith(
      UIActions.showErrorToast(
        `Using a dot at the end of a name is not permitted. Please rename or delete them from uploading files list: dotend.`,
      ),
    );
  });

  it('should detect both invalid name cases and show combined toast', () => {
    const badNameFile1 = createFile('bad@name.png');
    const badNameFile2 = createFile('dotend.');

    (fileUtils.getFilesWithInvalidFileName as jest.Mock).mockReturnValue({
      filesWithNotAllowedSymbols: [badNameFile1],
      filesWithDotInTheEnd: [badNameFile2],
    });

    const result = sanitizeAndReportFiles([badNameFile1, badNameFile2], dispatch, allowedTypes, maxSize);

    expect(result).toEqual([]);
    expect(dispatch).toHaveBeenCalledWith(
      UIActions.showErrorToast(
        `The symbols @#% and a dot at the end are not allowed in file name. Please rename or delete them from uploading files list: bad@name.png, dotend.`,
      ),
    );
  });
});
