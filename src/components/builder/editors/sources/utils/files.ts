import { Dispatch } from '@reduxjs/toolkit';
import bytes from 'bytes';

import { UIActions } from '@/store/builder/ui/ui.reducers';
import {
  getFilesWithInvalidFileExtension,
  getFilesWithInvalidFileName,
  getFilesWithInvalidFileSize,
  getFilesWithInvalidFileType,
  notAllowedSymbols,
} from '@/utils/app/file';

export const sanitizeAndReportFiles = (
  files: File[],
  dispatch: Dispatch,
  allowedTypes: string[],
  maxFileSize: number,
  allowedExtensions?: string[],
): File[] => {
  const incorrectSizeFiles: string[] = getFilesWithInvalidFileSize(files, maxFileSize).map(file => file.name);
  const incorrectTypeFiles: string[] = getFilesWithInvalidFileType(files, allowedTypes).map(file => file.name);

  const incorrectExtensionFiles: string[] = allowedExtensions?.length
    ? getFilesWithInvalidFileExtension(files, allowedExtensions).map(file => file.name)
    : [];

  const invalidFileNames = new Set([...incorrectSizeFiles, ...incorrectTypeFiles, ...incorrectExtensionFiles]);

  let filteredFiles = files.filter(file => !invalidFileNames.has(file.name));

  if (incorrectSizeFiles.length > 0) {
    dispatch(
      UIActions.showErrorToast(
        `Max file size up to ${bytes.format(maxFileSize, { unitSeparator: ' ' })}. Next files haven't been uploaded: ${incorrectSizeFiles.join(', ')}`,
      ),
    );
  }

  if (incorrectTypeFiles.length > 0) {
    dispatch(
      UIActions.showErrorToast(`You've trying to upload files with incorrect type: ${incorrectTypeFiles.join(', ')}`),
    );
  }

  const { filesWithNotAllowedSymbols, filesWithDotInTheEnd } = getFilesWithInvalidFileName(filteredFiles);
  const filesWithNotAllowedSymbolsNames = filesWithNotAllowedSymbols.map(f => f.name);
  const filesWithDotInTheEndNames = filesWithDotInTheEnd.map(f => f.name);

  if (filesWithNotAllowedSymbolsNames.length && filesWithDotInTheEndNames.length) {
    dispatch(
      UIActions.showErrorToast(
        `The symbols ${notAllowedSymbols} and a dot at the end are not allowed in file name. Please rename or delete them from uploading files list: ${filesWithNotAllowedSymbolsNames.join(', ')}`,
      ),
    );
  } else {
    if (filesWithNotAllowedSymbolsNames.length) {
      dispatch(
        UIActions.showErrorToast(
          `The symbols ${notAllowedSymbols} are not allowed in file name. Please rename or delete them from uploading files list: ${filesWithNotAllowedSymbolsNames.join(', ')}`,
        ),
      );
    }
    if (filesWithDotInTheEndNames.length) {
      dispatch(
        UIActions.showErrorToast(
          `Using a dot at the end of a name is not permitted. Please rename or delete them from uploading files list: ${filesWithDotInTheEndNames.join(', ')}`,
        ),
      );
    }
  }

  const allInvalidFiles = invalidFileNames.union(
    new Set([...filesWithNotAllowedSymbolsNames, ...filesWithDotInTheEndNames]),
  );

  filteredFiles = files.filter(file => !allInvalidFiles.has(file.name));

  return filteredFiles;
};
