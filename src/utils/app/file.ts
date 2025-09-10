import escapeRegExp from 'lodash-es/escapeRegExp';
import { extensions } from 'mime-types';

import { doesHaveDotsInTheEnd } from './common';

export const getFileNameWithoutExtension = (filename: string) =>
  filename.lastIndexOf('.') > 0 ? filename.slice(0, filename.lastIndexOf('.')) : filename;

export const getFileNameExtension = (filename: string) =>
  filename.lastIndexOf('.') > 0 ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : '';

export const prepareFileName = (filename: string) =>
  `${getFileNameWithoutExtension(filename)}${getFileNameExtension(filename)}`;

export const prepareStorageFontFileName = (filename: string): string =>
  `${Date.now()}-font.${getFileNameWithoutExtension(filename)}${getFileNameExtension(filename)}`;

export const isStorageFontFileName = (filename: string): boolean => {
  const timestampFontPrefixRegex = /^\d{13}-font\./;
  return timestampFontPrefixRegex.test(filename);
};

export const extractOriginalStorageFontFileName = (storageFileName: string): string => {
  const pattern = /^\d{13}-font\.(.+)$/;
  const match = storageFileName.match(pattern);
  return match ? match[1] : '';
};

export const extractPrefixStorageFontFileName = (storageFileName: string): string => {
  const match = storageFileName.match(/^(\d{13}-font)\./);
  return match ? match[1] : '';
};

export const getFilesWithInvalidFileSize = (files: File[], sizeLimit: number): File[] => {
  return files.filter(file => file.size > sizeLimit);
};

export const getFilesWithInvalidFileType = (files: File[], allowedFileTypes: string[]): File[] => {
  return allowedFileTypes.includes('*/*') ? [] : files.filter(file => !isAllowedMimeType(allowedFileTypes, file.type));
};

export const getFilesWithInvalidFileExtension = (files: File[], allowedFileExtensions: string[]): File[] => {
  if (allowedFileExtensions.includes('*')) {
    return [];
  }

  return files.filter(file => !isAllowedFileExtension(allowedFileExtensions, file.name));
};

export const isAllowedFileExtension = (allowedFileExtensions: string[], fileName: string): boolean => {
  const lowerCaseExtensions = allowedFileExtensions.map(ext => ext.toLowerCase());
  const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();

  return lowerCaseExtensions.includes(fileExtension);
};

export const isAllowedMimeType = (allowedMimeTypes: string[], resourceMimeType: string) => {
  if (allowedMimeTypes.includes('*/*')) {
    return true;
  }

  const [resourceSubset, resourceTypeName] = resourceMimeType.toLowerCase().split('/');

  return allowedMimeTypes.some(allowedMimeType => {
    const [subset, name] = allowedMimeType.toLowerCase().split('/');

    return subset === resourceSubset && (name === '*' || name === resourceTypeName);
  });
};

export const notAllowedSymbols = ':;,=/{}%&\\"';
export const notAllowedSymbolsRegex = new RegExp(
  `[${escapeRegExp(notAllowedSymbols)}]|(\r\n|\n|\r|\t)|[\x00-\x1F]`,
  'gm',
);

export const getFilesWithInvalidFileName = <T extends { name: string }>(
  files: T[],
): { filesWithNotAllowedSymbols: T[]; filesWithDotInTheEnd: T[] } => ({
  filesWithNotAllowedSymbols: files.filter(({ name }) => name.match(notAllowedSymbolsRegex)),
  filesWithDotInTheEnd: files.filter(({ name }) => doesHaveDotsInTheEnd(name)),
});

export const getExtensionsListForMimeType = (mimeType: string) => {
  const [subset, name] = mimeType.split('/');

  if (subset === '*') {
    return ['all'];
  } else if (name === '*') {
    return Object.entries(extensions).reduce((acc, [key, value]) => {
      const [keySubset] = key.split('/');
      if (keySubset === subset) {
        acc.push(...value);
      }

      return acc;
    }, [] as string[]);
  } else {
    return extensions[mimeType] || [];
  }
};

export const getExtensionsListForMimeTypes = (mimeTypes: string[]) => {
  return mimeTypes
    .map(mimeType => getExtensionsListForMimeType(mimeType))
    .flat()
    .map(type => `.${type}`);
};

export const getShortExtensionsListFromMimeType = (mimeTypes: string[]) => {
  return mimeTypes
    .map(mimeType => {
      if (mimeType.endsWith('/*')) {
        return mimeType.replace('/*', 's');
      }

      return getExtensionsListForMimeType(mimeType)
        .flat()
        .map(type => `.${type}`);
    })
    .flat();
};

export const isAbsoluteUrl = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  return ['data:', '//', 'http://', 'https://', 'file://', 'ftp://', 'mailto:', 'telnet://', 'api/files'].some(prefix =>
    urlLower.startsWith(prefix),
  );
};

export const constructPath = (...values: (string | undefined | null)[]): string => {
  return values
    .filter(Boolean)
    .map(value => value!.replace(/(^\/+|\/+$)/g, ''))
    .join('/');
};
