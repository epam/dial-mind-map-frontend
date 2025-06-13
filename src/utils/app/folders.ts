import { constructPath } from './file';

// {apikey}/{bucket}/path.../name
export const splitEntityId = (
  id: string,
): {
  bucket: string;
  name: string;
  parentPath: string | undefined;
  apiKey: string;
} => {
  const parts = id.split('/');
  const parentPath = parts.length > 3 ? constructPath(...parts.slice(2, parts.length - 1)) : undefined;

  return {
    apiKey: parts[0],
    bucket: parts[1],
    parentPath,
    name: parts[parts.length - 1],
  };
};

export const getDecodedFolderPath = (folderPath: string, targetFolderName: string = '') => {
  const pathParts = folderPath.split('/').map(decodeURIComponent);
  return constructPath(...pathParts, targetFolderName);
};
