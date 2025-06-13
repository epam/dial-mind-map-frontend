import { lastValueFrom, of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import {
  ApiUtils,
  decodeModelId,
  encodeModelId,
  getConversationApiKey,
  parseConversationApiKey,
  ServerUtils,
} from '../api';

describe('ServerUtils', () => {
  describe('encodeSlugs', () => {
    const originalConstructPath = (global as any).constructPath;
    const originalApiUtils = (global as any).ApiUtils;

    beforeAll(() => {
      // Replace dependencies:
      // - constructPath concatenates path segments with a "/"
      // - safeEncodeURIComponent uses the standard encodeURIComponent.
      (global as any).constructPath = (...parts: string[]) => parts.join('/');
      (global as any).ApiUtils = {
        safeEncodeURIComponent: (s: string) => encodeURIComponent(s),
      };
    });

    afterAll(() => {
      (global as any).constructPath = originalConstructPath;
      (global as any).ApiUtils = originalApiUtils;
    });

    it('should filter out undefined and properly encode the strings', () => {
      const slugs = [undefined, 'hello world', 'test'];
      // After filtering, only "hello world" and "test" remain, which are encoded and joined by "/"
      const expected = 'hello%20world/test';
      expect(ServerUtils.encodeSlugs(slugs)).toBe(expected);
    });

    it('should return an empty string if all elements are undefined', () => {
      const slugs = [undefined, undefined];
      expect(ServerUtils.encodeSlugs(slugs)).toBe('');
    });
  });

  describe('safeDecodeURI', () => {
    it('should correctly decode valid URI components', () => {
      const encoded = 'hello%20world';
      expect(ServerUtils.safeDecodeURI(encoded)).toBe('hello world');
    });

    it('should return the original string if decoding fails', () => {
      const invalid = '%';
      // decodeURIComponent('%') throws an error, so the function should return the original string
      expect(ServerUtils.safeDecodeURI(invalid)).toBe(invalid);
    });
  });

  describe('getErrorMessageFromResponse', () => {
    it('should return a decoded message if the response text is a valid JSON string', async () => {
      // JSON string: "Error occurred"
      const res = {
        text: () => Promise.resolve('"Error occurred"'),
      } as Response;
      const message = await ServerUtils.getErrorMessageFromResponse(res);
      expect(message).toBe('Error occurred');
    });

    it('should return a JSON representation if the response text is a valid JSON object', async () => {
      const obj = { error: 'Not Found' };
      const jsonString = JSON.stringify(obj);
      const res = {
        text: () => Promise.resolve(jsonString),
      } as Response;
      const message = await ServerUtils.getErrorMessageFromResponse(res);
      expect(message).toBe(jsonString);
    });

    it('should return the decoded text if JSON parsing fails', async () => {
      const text = 'Simple error text';
      const res = {
        text: () => Promise.resolve(text),
      } as Response;
      const message = await ServerUtils.getErrorMessageFromResponse(res);
      expect(message).toBe(text);
    });

    it('should return null if res.text() throws an error', async () => {
      const res = {
        text: () => Promise.reject(new Error('Network error')),
      } as Response;
      const message = await ServerUtils.getErrorMessageFromResponse(res);
      expect(message).toBeNull();
    });
  });
});

jest.mock('rxjs/fetch', () => ({
  fromFetch: jest.fn(),
}));

if (!global.fetch) {
  (global as any).fetch = jest.fn();
}

describe('ApiUtils', () => {
  describe('safeEncodeURIComponent', () => {
    it('should correctly encode normal strings using encodeURIComponent', () => {
      const input = 'hello world';
      const expected = encodeURIComponent('hello world');
      expect(ApiUtils.safeEncodeURIComponent(input)).toBe(expected);
    });

    it('should not encode surrogate pairs (e.g., emoji)', () => {
      const emoji = '😊';
      expect(ApiUtils.safeEncodeURIComponent(emoji)).toBe(emoji);
    });
  });

  describe('encodeApiUrl', () => {
    const originalConstructPath = (global as any).constructPath;
    beforeAll(() => {
      (global as any).constructPath = (...parts: string[]) => parts.join('/');
    });
    afterAll(() => {
      (global as any).constructPath = originalConstructPath;
    });

    it('should encode each part of the URL path', () => {
      const path = 'hello world/test';
      const expected = `${encodeURIComponent('hello world')}/${encodeURIComponent('test')}`;
      expect(ApiUtils.encodeApiUrl(path)).toBe(expected);
    });
  });

  describe('decodeApiUrl', () => {
    const originalConstructPath = (global as any).constructPath;
    beforeAll(() => {
      (global as any).constructPath = (...parts: string[]) => parts.join('/');
    });
    afterAll(() => {
      (global as any).constructPath = originalConstructPath;
    });

    it('should decode each part of the URL path', () => {
      const path = 'hello%20world/test';
      const expected = 'hello world/test';
      expect(ApiUtils.decodeApiUrl(path)).toBe(expected);
    });
  });

  describe('request', () => {
    const mockedFromFetch = fromFetch as jest.Mock;

    it('should return JSON data for a successful response', async () => {
      const fakeResponse = {
        ok: true,
        json: () => Promise.resolve({ data: 'value' }),
      };
      mockedFromFetch.mockReturnValueOnce(of(fakeResponse));
      const result = await lastValueFrom(ApiUtils.request('fake-url'));
      expect(result).toEqual({ data: 'value' });
    });

    it('should throw an error for a non-successful response', async () => {
      const fakeResponse = {
        ok: false,
        status: 400,
        text: () => Promise.resolve('"Bad Request"'),
      };
      mockedFromFetch.mockReturnValueOnce(of(fakeResponse));
      await expect(lastValueFrom(ApiUtils.request('fake-url'))).rejects.toThrow('Bad Request');
    });

    it('should throw an error with response status if error message is falsy', async () => {
      const fakeResponse = {
        ok: false,
        status: 404,
        text: () => Promise.resolve('ignored text'),
      };

      jest.spyOn(ServerUtils, 'getErrorMessageFromResponse').mockResolvedValueOnce(null);

      (fromFetch as jest.Mock).mockReturnValueOnce(of(fakeResponse));

      await expect(lastValueFrom(ApiUtils.request('fake-url'))).rejects.toThrow('404');
    });
  });

  describe('requestOld', () => {
    let originalXMLHttpRequest: any;
    class FakeXMLHttpRequest {
      status: number = 0;
      response: any = null;
      responseType: string = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
      open = jest.fn();
      send = jest.fn();
      abort = jest.fn();
    }

    let xhrInstance: FakeXMLHttpRequest | null = null;
    beforeEach(() => {
      originalXMLHttpRequest = (global as any).XMLHttpRequest;
      (global as any).XMLHttpRequest = jest.fn(() => {
        xhrInstance = new FakeXMLHttpRequest();
        return xhrInstance;
      });
    });
    afterEach(() => {
      (global as any).XMLHttpRequest = originalXMLHttpRequest;
    });

    it('should emit progress and then result on a successful request', done => {
      const fakeResponse = { message: 'success' };
      const observable = ApiUtils.requestOld({
        url: 'fake-url',
        method: 'GET' as any,
        async: true,
        body: null,
      });

      const emitted: any[] = [];
      observable.subscribe({
        next: value => emitted.push(value),
        error: err => done(err),
        complete: () => {
          try {
            expect(emitted).toEqual([{ percent: 50 }, { result: fakeResponse }]);
            done();
          } catch (e) {
            done(e);
          }
        },
      });

      if (xhrInstance && xhrInstance.upload.onprogress) {
        xhrInstance.upload.onprogress({
          lengthComputable: true,
          loaded: 50,
          total: 100,
        } as ProgressEvent);
      }
      if (xhrInstance) {
        xhrInstance.status = 200;
        xhrInstance.response = fakeResponse;
        if (xhrInstance.onload) {
          xhrInstance.onload();
        }
      }
    });

    it('should emit an error for a non-200 status response', done => {
      const observable = ApiUtils.requestOld({
        url: 'fake-url',
        method: 'GET' as any,
        async: true,
        body: null,
      });

      observable.subscribe({
        next: () => {},
        error: err => {
          try {
            expect(err).toBe('Request failed');
            done();
          } catch (e) {
            done(e);
          }
        },
        complete: () => done(new Error('Request should not complete successfully')),
      });

      // Simulate onload with an error status (e.g., 400)
      if (xhrInstance) {
        xhrInstance.status = 400;
        if (xhrInstance.onload) {
          xhrInstance.onload();
        }
      }
    });

    it('should emit an error on request error event', done => {
      const observable = ApiUtils.requestOld({
        url: 'fake-url',
        method: 'GET' as any,
        async: true,
        body: null,
      });

      observable.subscribe({
        next: () => {},
        error: err => {
          try {
            expect(err).toBe('Request failed');
            done();
          } catch (e) {
            done(e);
          }
        },
        complete: () => done(new Error('Request should not complete successfully')),
      });

      if (xhrInstance && xhrInstance.onerror) {
        xhrInstance.onerror();
      }
    });

    it('should call abort when unsubscribing from the request', () => {
      const observable = ApiUtils.requestOld({
        url: 'fake-url',
        method: 'GET' as any,
        async: true,
        body: null,
      });
      const subscription = observable.subscribe({
        next: () => {},
        error: () => {},
        complete: () => {},
      });
      subscription.unsubscribe();
      // Verify that abort was called
      expect(xhrInstance?.abort).toHaveBeenCalled();
    });
  });
});

describe('parseConversationApiKey', () => {
  const originalPathKeySeparator = (global as any).pathKeySeparator;
  const originalEMPTY_MODEL_ID = (global as any).EMPTY_MODEL_ID;
  const originalDecodeModelId = (global as any).decodeModelId;

  beforeAll(() => {
    // For testing, we override globals to match the observed behavior:
    // - pathKeySeparator is '__'
    // - EMPTY_MODEL_ID is 'empty'
    // - decodeModelId is the identity function
    (global as any).pathKeySeparator = '__';
    (global as any).EMPTY_MODEL_ID = 'empty';
    (global as any).decodeModelId = (s: string) => s;
  });

  afterAll(() => {
    // Restore original globals
    (global as any).pathKeySeparator = originalPathKeySeparator;
    (global as any).EMPTY_MODEL_ID = originalEMPTY_MODEL_ID;
    (global as any).decodeModelId = originalDecodeModelId;
  });

  it('should return default model id ("empty") and use the entire apiKey as name if no separator is found', () => {
    const apiKey = 'conversation';
    const expected = {
      model: { id: 'empty' },
      name: 'conversation',
    };
    expect(parseConversationApiKey(apiKey)).toEqual(expected);
  });

  it('should parse apiKey with the correct format {modelId}__{name}', () => {
    const apiKey = 'abc__conversation';
    const expected = {
      model: { id: 'abc' },
      name: 'conversation',
    };
    expect(parseConversationApiKey(apiKey)).toEqual(expected);
  });

  it('should join multiple parts after the first as the name when multiple separators are present', () => {
    const apiKey = 'abc__conversation__extra';
    const expected = {
      model: { id: 'abc' },
      name: 'conversation__extra',
    };
    expect(parseConversationApiKey(apiKey)).toEqual(expected);
  });

  it('should handle an empty string as the apiKey', () => {
    const apiKey = '';
    const expected = {
      model: { id: 'empty' },
      name: '',
    };
    expect(parseConversationApiKey(apiKey)).toEqual(expected);
  });
});

describe('Model ID and Conversation API Key Utilities', () => {
  const originalPathKeySeparator = (global as any).pathKeySeparator;
  const originalEncodedKeySeparator = (global as any).encodedKeySeparator;
  const originalEMPTY_MODEL_ID = (global as any).EMPTY_MODEL_ID;

  beforeAll(() => {
    (global as any).pathKeySeparator = '__';
    (global as any).encodedKeySeparator = '##';
    (global as any).EMPTY_MODEL_ID = 'empty';
  });

  afterAll(() => {
    (global as any).pathKeySeparator = originalPathKeySeparator;
    (global as any).encodedKeySeparator = originalEncodedKeySeparator;
    (global as any).EMPTY_MODEL_ID = originalEMPTY_MODEL_ID;
  });

  describe('encodeModelId', () => {
    it('should encode a modelId without the separator', () => {
      const modelId = 'abc def';
      const expected = encodeURI('abc def');
      expect(encodeModelId(modelId)).toBe(expected);
    });
  });

  describe('decodeModelId', () => {
    it('should decode an encoded modelId back to its original form', () => {
      const originalModelId = 'abc def__ghi';
      const encoded = encodeModelId(originalModelId);
      const decoded = decodeModelId(encoded);
      expect(decoded).toBe(originalModelId);
    });

    it('should correctly decode a modelId that does not contain the encoded separator', () => {
      const originalModelId = 'abc def';
      const encoded = encodeModelId(originalModelId);
      const decoded = decodeModelId(encoded);
      expect(decoded).toBe(originalModelId);
    });
  });

  describe('getConversationApiKey', () => {
    it('should return conversation name if model.id equals EMPTY_MODEL_ID', () => {
      const conversation = {
        model: { id: 'empty' },
        name: 'Test Conversation',
      };
      const expected = 'Test Conversation';
      expect(getConversationApiKey(conversation)).toBe(expected);
    });

    it('should return a key in the format "{encodedModelId}{pathKeySeparator}{name}" when model.id is valid', () => {
      const conversation = {
        model: { id: 'abc def' },
        name: 'Test Conversation',
      };
      const expected = `${encodeModelId('abc def')}__Test Conversation`;
      expect(getConversationApiKey(conversation)).toBe(expected);
    });

    it('should correctly handle model.id containing the separator', () => {
      const conversation = {
        model: { id: 'part1__part2' },
        name: 'Test Conversation',
      };
      const expected = `${encodeModelId('part1__part2')}__Test Conversation`;
      expect(getConversationApiKey(conversation)).toBe(expected);
    });
  });
});
