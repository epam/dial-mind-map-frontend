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
  allowSpecialSymbols: boolean = false,
): File[] => {
  const incorrectSizeFiles = getFilesWithInvalidFileSize(files, maxFileSize).map(f => f.name);
  const incorrectTypeFiles = getFilesWithInvalidFileType(files, allowedTypes).map(f => f.name);

  const incorrectExtensionFiles = allowedExtensions?.length
    ? getFilesWithInvalidFileExtension(files, allowedExtensions).map(f => f.name)
    : [];

  const basicInvalidNames = new Set([...incorrectSizeFiles, ...incorrectTypeFiles, ...incorrectExtensionFiles]);

  let filteredFiles = files.filter(f => !basicInvalidNames.has(f.name));

  if (incorrectSizeFiles.length) {
    dispatch(
      UIActions.showErrorToast(
        `Max file size up to ${bytes.format(maxFileSize, { unitSeparator: ' ' })}. Next files haven't been uploaded: ${incorrectSizeFiles.join(', ')}`,
      ),
    );
  }

  if (incorrectTypeFiles.length) {
    dispatch(
      UIActions.showErrorToast(`You've trying to upload files with incorrect type: ${incorrectTypeFiles.join(', ')}`),
    );
  }

  const { filesWithNotAllowedSymbols, filesWithDotInTheEnd } = getFilesWithInvalidFileName(filteredFiles);

  const notAllowedNames = allowSpecialSymbols ? [] : filesWithNotAllowedSymbols.map(f => f.name);
  const dotAtEndNames = filesWithDotInTheEnd.map(f => f.name);

  if (notAllowedNames.length && dotAtEndNames.length) {
    dispatch(
      UIActions.showErrorToast(
        `The symbols ${notAllowedSymbols} and a dot at the end are not allowed in file name. Please rename or delete them from uploading files list: ${notAllowedNames.concat(dotAtEndNames).join(', ')}`,
      ),
    );
  } else {
    if (notAllowedNames.length) {
      dispatch(
        UIActions.showErrorToast(
          `The symbols ${notAllowedSymbols} are not allowed in file name. Please rename or delete them from uploading files list: ${notAllowedNames.join(', ')}`,
        ),
      );
    }

    if (dotAtEndNames.length) {
      dispatch(
        UIActions.showErrorToast(
          `Using a dot at the end of a name is not permitted. Please rename or delete them from uploading files list: ${dotAtEndNames.join(', ')}`,
        ),
      );
    }
  }

  const allInvalid = new Set([...basicInvalidNames, ...notAllowedNames, ...dotAtEndNames]);

  filteredFiles = files.filter(f => !allInvalid.has(f.name));

  return filteredFiles;
};
