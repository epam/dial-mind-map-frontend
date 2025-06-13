import { constructPath } from '../file';
import { getDecodedFolderPath } from '../folders';

jest.mock('../file', () => ({
  constructPath: jest.fn((...args) => args.join('/')),
}));

describe('getDecodedFolderPath', () => {
  it('should decode encoded folder path', () => {
    const encodedPath = 'folder%20one/folder%20two';
    expect(getDecodedFolderPath(encodedPath)).toBe('folder one/folder two/');
  });

  it('should append target folder name if provided', () => {
    const encodedPath = 'folder%20one/folder%20two';
    expect(getDecodedFolderPath(encodedPath, 'target')).toBe('folder one/folder two/target');
  });

  it('should return only the target folder name if folderPath is empty', () => {
    expect(getDecodedFolderPath('', 'target')).toBe('/target');
  });

  it('should return an empty string if both folderPath and targetFolderName are empty', () => {
    expect(getDecodedFolderPath('', '')).toBe('/');
  });

  it('should handle paths without encoding', () => {
    expect(getDecodedFolderPath('simple/path')).toBe('simple/path/');
  });

  it('should call constructPath with decoded segments', () => {
    const encodedPath = 'folder%201/folder%202';
    getDecodedFolderPath(encodedPath, 'target');

    expect(constructPath).toHaveBeenCalledWith('folder 1', 'folder 2', 'target');
  });
});
