import { Application } from '@/types/application';

import { generateMindmapFolderPath } from '../application';

describe('generateMindmapFolderPath', () => {
  it('should return an empty string if application is undefined', () => {
    expect(generateMindmapFolderPath()).toBe('');
  });

  it('should generate a correct folder path when application is provided', () => {
    const mockApplication: Application = {
      name: 'api-key/bucket123/my-app',
      reference: 'ref-456',
      application_properties: null,
    };

    expect(generateMindmapFolderPath(mockApplication)).toBe('files/bucket123/appdata/mindmap/my-app__ref-456/');
  });

  it('should handle cases where application name has unexpected format', () => {
    const mockApplication: Application = {
      name: 'invalid-name-format',
      reference: 'ref-789',
      application_properties: null,
    };

    expect(generateMindmapFolderPath(mockApplication)).toBe('files/undefined/appdata/mindmap/undefined__ref-789/');
  });

  it('should handle cases where application reference is empty', () => {
    const mockApplication: Application = {
      name: 'api-key/bucket456/some-app',
      reference: '',
      application_properties: null,
    };

    expect(generateMindmapFolderPath(mockApplication)).toBe('files/bucket456/appdata/mindmap/some-app__/');
  });
});
