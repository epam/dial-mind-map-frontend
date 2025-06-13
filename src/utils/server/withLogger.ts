import { NextRequest, NextResponse } from 'next/server';

export function withLogger<T = unknown>(handler: (req: NextRequest, context: T) => Promise<NextResponse>) {
  return async (req: NextRequest, context: T) => {
    const start = process.hrtime();
    const { pathname, searchParams } = req.nextUrl;

    console.log(`[Next] - ${new Date().toISOString()} - LOG [LoggingMiddleware] Start: ${pathname}`);

    try {
      const response = await handler(req, context);

      const duration = getDuration(start);
      const log = {
        msg: 'Processed request',
        url: `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`,
        method: req.method,
        status: response.status,
        duration,
      };

      console.log(`[Next] - ${new Date().toISOString()} - LOG [LoggingMiddleware]`, log);

      return response;
    } catch (error: any) {
      const duration = getDuration(start);
      console.error(`[Next] - ${new Date().toISOString()} - ERROR [LoggingMiddleware]`, {
        msg: 'Request failed',
        url: pathname,
        method: req.method,
        duration,
        error: error.message,
      });
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}

function getDuration(start: [number, number]) {
  const [seconds, nanoseconds] = process.hrtime(start);
  return (seconds * 1000 + nanoseconds / 1e6).toFixed(3);
}
