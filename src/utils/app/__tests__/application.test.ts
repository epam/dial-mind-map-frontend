import { decodeAppPathSafely, getAppPathWithEncodedAppName } from '../application';

describe('getAppPathWithEncodedAppName', () => {
  it('should encode the application name in the appId', () => {
    const appId = 'appSlug/bucketId/My Application';
    const result = getAppPathWithEncodedAppName(appId);
    expect(result).toBe('appSlug/bucketId/My%20Application');
  });

  it('should handle appId with no application name', () => {
    const appId = 'appSlug/bucketId/';
    const result = getAppPathWithEncodedAppName(appId);
    expect(result).toBe('appSlug/bucketId');
  });

  it('should handle appId with missing parts', () => {
    const appId = 'appSlug/';
    const result = getAppPathWithEncodedAppName(appId);
    expect(result).toBe('appSlug');
  });

  it('should handle empty appId', () => {
    const appId = '';
    const result = getAppPathWithEncodedAppName(appId);
    expect(result).toBe('');
  });
});

describe('decodeAppPathSafely', () => {
  it('should decode an encoded appPath', () => {
    const appPath = 'appSlug/bucketId/My%20Application';
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('appSlug/bucketId/My%20Application');
  });

  it('should handle appPath with no encoded parts', () => {
    const appPath = 'appSlug/bucketId/MyApplication';
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('appSlug/bucketId/MyApplication');
  });

  it('should handle empty appPath', () => {
    const appPath = '';
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('');
  });

  it('should handle null appPath', () => {
    const appPath = null as unknown as string;
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('');
  });

  it('should handle appPath with special characters', () => {
    const appPath = 'appSlug/bucketId/My%20App%21%40%23';
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('appSlug/bucketId/My%20App!%40%23');
  });

  it('should decode a fully encoded appPath', () => {
    const appPath = 'appSlug%2FbucketId%2FMy%20Application';
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('appSlug/bucketId/My%20Application');
  });

  it('should decode a fully encoded appPath with special characters', () => {
    const appPath = 'appSlug%2FbucketId%2FMy%20App%21%40%23';
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('appSlug/bucketId/My%20App!%40%23');
  });

  it('should decode a fully encoded appPath with missing parts', () => {
    const appPath = 'appSlug%2FbucketId%2F';
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('appSlug/bucketId');
  });

  it('should decode a fully encoded appPath with only appSlug', () => {
    const appPath = 'appSlug%2F%2F';
    const result = decodeAppPathSafely(appPath);
    expect(result).toBe('appSlug');
  });
});
