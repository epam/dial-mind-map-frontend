import {
  constructPath,
  extractOriginalStorageFontFileName,
  getFilesWithInvalidFileExtension,
  isAbsoluteUrl,
  isAllowedFileExtension,
  isStorageFontFileName,
  prepareStorageFontFileName,
} from '../file';

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

describe('prepareStorageFontFileName', () => {
  it('should return a filename that starts with timestamp and -font.', () => {
    const baseFile = 'myFont.woff';
    const result = prepareStorageFontFileName(baseFile);

    const pattern = /^\d{13}-font\.myFont\.woff$/;
    expect(result).toMatch(pattern);
  });

  it('should handle files without extension', () => {
    const baseFile = 'fontfile';
    const result = prepareStorageFontFileName(baseFile);

    const pattern = /^\d{13}-font\.fontfile$/;
    expect(result).toMatch(pattern);
  });
});

describe('isStorageFontFileName', () => {
  it('should return true for filenames created with prepareStorageFontFileName', () => {
    const prepared = prepareStorageFontFileName('font.woff');
    expect(isStorageFontFileName(prepared)).toBe(true);
  });

  it('should return false for filenames not matching the pattern', () => {
    expect(isStorageFontFileName('font.woff')).toBe(false);
    expect(isStorageFontFileName('2025-07-15-font.woff')).toBe(false);
    expect(isStorageFontFileName('162635298000-font.woff')).toBe(false); // only 12 digits
    expect(isStorageFontFileName('12345678901234-font.woff')).toBe(false); // 14 digits
  });

  it('should return false for completely unrelated filenames', () => {
    expect(isStorageFontFileName('randomfile.txt')).toBe(false);
  });
});

describe('extractOriginalStorageFontFileName', () => {
  it('should extract original filename from a valid storage font filename', () => {
    const original = 'OpenSans-Regular.woff2';
    const generated = prepareStorageFontFileName(original);
    expect(extractOriginalStorageFontFileName(generated)).toBe(original);
  });

  it('should return empty string for invalid storage font filenames', () => {
    expect(extractOriginalStorageFontFileName('font.woff')).toBe('');
    expect(extractOriginalStorageFontFileName('2025-07-15-font.woff')).toBe('');
    expect(extractOriginalStorageFontFileName('1234567890-font.woff')).toBe('');
    expect(extractOriginalStorageFontFileName('randomfile.txt')).toBe('');
  });

  it('should handle filenames with multiple dots correctly', () => {
    const original = 'font.name.with.dots.ttf';
    const generated = prepareStorageFontFileName(original);
    expect(extractOriginalStorageFontFileName(generated)).toBe(original);
  });
});

describe('File extension validation', () => {
  const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];

  const makeFile = (name: string, type: string) => new File([''], name, { type });

  test('isAllowedFileExtension returns true for allowed extensions', () => {
    expect(isAllowedFileExtension(allowedExtensions, 'font.TTF')).toBe(true);
    expect(isAllowedFileExtension(allowedExtensions, 'myfont.woff2')).toBe(true);
    expect(isAllowedFileExtension(allowedExtensions, 'file.otf')).toBe(true);
  });

  test('isAllowedFileExtension returns false for disallowed extensions', () => {
    expect(isAllowedFileExtension(allowedExtensions, 'image.png')).toBe(false);
    expect(isAllowedFileExtension(allowedExtensions, 'document.pdf')).toBe(false);
    expect(isAllowedFileExtension(allowedExtensions, 'fontwoff')).toBe(false); // no dot
    expect(isAllowedFileExtension(allowedExtensions, 'noextension')).toBe(false);
  });

  test('getFilesWithInvalidFileExtension filters invalid files', () => {
    const files = [
      makeFile('font1.ttf', 'font/ttf'),
      makeFile('font2.woff2', 'font/woff2'),
      makeFile('image.png', 'image/png'),
      makeFile('doc.pdf', 'application/pdf'),
    ];

    const invalid = getFilesWithInvalidFileExtension(files, allowedExtensions);
    expect(invalid).toHaveLength(2);
    expect(invalid.map(f => f.name)).toEqual(['image.png', 'doc.pdf']);
  });

  test('getFilesWithInvalidFileExtension returns empty array if wildcard * is used', () => {
    const files = [makeFile('anyfile.xyz', 'application/octet-stream')];
    const invalid = getFilesWithInvalidFileExtension(files, ['*']);
    expect(invalid).toHaveLength(0);
  });
});

describe('isAbsoluteUrl', () => {
  it('returns true for data URLs', () => {
    expect(isAbsoluteUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA')).toBe(true);
  });

  it('returns true for protocol-relative URLs', () => {
    expect(isAbsoluteUrl('//example.com/path')).toBe(true);
  });

  it('returns true for http and https URLs', () => {
    expect(isAbsoluteUrl('http://example.com')).toBe(true);
    expect(isAbsoluteUrl('https://example.com')).toBe(true);
  });

  it('returns true for file URLs', () => {
    expect(isAbsoluteUrl('file://C:/path/to/file.txt')).toBe(true);
  });

  it('returns true for ftp URLs', () => {
    expect(isAbsoluteUrl('ftp://example.com/file')).toBe(true);
  });

  it('returns true for mailto URLs', () => {
    expect(isAbsoluteUrl('mailto:user@example.com')).toBe(true);
  });

  it('returns true for telnet URLs', () => {
    expect(isAbsoluteUrl('telnet://example.com')).toBe(true);
  });

  it('returns true for api/files URLs', () => {
    expect(isAbsoluteUrl('api/files/1234')).toBe(true);
  });

  it('returns false for relative URLs', () => {
    expect(isAbsoluteUrl('/relative/path')).toBe(false);
    expect(isAbsoluteUrl('images/pic.jpg')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isAbsoluteUrl('HTTP://example.com')).toBe(true);
    expect(isAbsoluteUrl('Api/Files/123')).toBe(true);
  });
});
