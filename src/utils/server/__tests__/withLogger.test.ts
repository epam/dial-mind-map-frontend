jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init: { status: number }) => ({
      status: init.status,
      json: async () => body,
    }),
  },
  NextRequest: class {},
}));

import { withLogger } from '../withLogger';

describe('withLogger middleware', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const baseReq = {
    nextUrl: {
      pathname: '/api/test',
      searchParams: new URLSearchParams('foo=bar'),
    },
    method: 'POST',
  } as any;
  const mockContext = {} as any;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'hrtime').mockImplementation((start?: [number, number]) => {
      if (!start) return [2, 0];
      return [1, 500000000];
    });
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-07-09T12:00:00.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.skip('logs start and end timing when query parameters exist', async () => {
    const req = { ...baseReq };
    const handler = jest.fn(async () => ({ status: 201, json: async () => ({ ok: true }) }));
    const wrapped = withLogger(handler as any);

    const response = await wrapped(req, mockContext);

    expect(handler).toHaveBeenCalledWith(req, mockContext);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `[Next] - 2025-07-09T12:00:00.000Z - LOG [LoggingMiddleware] Start: /api/test`,
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(`[Next] - 2025-07-09T12:00:00.000Z - LOG [LoggingMiddleware]`, {
      msg: 'Processed request',
      url: '/api/test?foo=bar',
      method: 'POST',
      status: 201,
      duration: '1500.000',
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
  });

  test.skip('logs start and end timing when no query parameters', async () => {
    const req = { ...baseReq, nextUrl: { ...baseReq.nextUrl, searchParams: new URLSearchParams() } };
    const handler = jest.fn(async () => ({ status: 200, json: async () => ({ ok: true, noQuery: true }) }));
    const wrapped = withLogger(handler as any);

    const response = await wrapped(req, mockContext);

    expect(handler).toHaveBeenCalledWith(req, mockContext);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `[Next] - 2025-07-09T12:00:00.000Z - LOG [LoggingMiddleware] Start: /api/test`,
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(`[Next] - 2025-07-09T12:00:00.000Z - LOG [LoggingMiddleware]`, {
      msg: 'Processed request',
      url: '/api/test',
      method: 'POST',
      status: 200,
      duration: '1500.000',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, noQuery: true });
  });

  test('logs error and returns 500 JSON on handler exception', async () => {
    const req = { ...baseReq };
    const handler = jest.fn(async () => {
      throw new Error('handler failure');
    });
    const wrapped = withLogger(handler as any);

    const response = await wrapped(req, mockContext);

    expect(handler).toHaveBeenCalledWith(req, mockContext);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `[Next] - 2025-07-09T12:00:00.000Z - LOG [LoggingMiddleware] Start: /api/test`,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(`[Next] - 2025-07-09T12:00:00.000Z - ERROR [LoggingMiddleware]`, {
      msg: 'Request failed',
      url: '/api/test',
      method: 'POST',
      duration: '1500.000',
      error: 'handler failure',
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal Server Error' });
  });
});
