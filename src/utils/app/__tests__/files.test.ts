import { constructPath } from '../file';

describe('constructPath', () => {
  it('should join multiple path segments correctly', () => {
    expect(constructPath('api', 'v1', 'users')).toBe('api/v1/users');
  });

  it('should handle leading and trailing slashes', () => {
    expect(constructPath('/api/', '/v1/', '/users/')).toBe('api/v1/users');
  });

  it('should ignore empty, undefined, or null values', () => {
    expect(constructPath('api', null, 'v1', undefined, '', 'users')).toBe('api/v1/users');
  });

  it('should return an empty string if all values are empty, null, or undefined', () => {
    expect(constructPath(null, undefined, '')).toBe('');
  });

  it('should handle single path segment correctly', () => {
    expect(constructPath('users')).toBe('users');
  });
});
