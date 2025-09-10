import { checkForUnauthorized } from '../checkForUnauthorized';

describe('checkForUnauthorized', () => {
  it('should pass through non-401/403 responses', done => {
    const resp = {
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({}),
    } as Response;

    const emitted: Response[] = [];
    checkForUnauthorized(resp).subscribe({
      next: r => emitted.push(r),
      error: () => done.fail('Should not error'),
      complete: () => {
        expect(emitted).toEqual([resp]);
        done();
      },
    });
  });

  it("throws {status:401, body:{error:'Unauthorized'}} when status=401 and statusText='Unauthorized'", done => {
    const resp = {
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ foo: 'bar' }),
    } as Response;

    checkForUnauthorized(resp).subscribe({
      next: () => done.fail('Should not emit next'),
      error: err => {
        expect(err).toEqual({ status: 401, body: { error: 'Unauthorized' } });
        done();
      },
      complete: () => done.fail('Should not complete'),
    });
  });

  it('throws parsed body when status=401 and statusText != Unauthorized', done => {
    const body = { detail: 'Not allowed' };
    const resp = {
      status: 401,
      statusText: 'Unauth',
      json: () => Promise.resolve(body),
    } as Response;

    checkForUnauthorized(resp).subscribe({
      next: () => done.fail('Should not emit next'),
      error: err => {
        expect(err).toEqual({ status: 401, body });
        done();
      },
      complete: () => done.fail('Should not complete'),
    });
  });

  it('throws parsed body when status=403', done => {
    const body = { reason: 'Forbidden' };
    const resp = {
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.resolve(body),
    } as Response;

    checkForUnauthorized(resp).subscribe({
      next: () => done.fail('Should not emit next'),
      error: err => {
        expect(err).toEqual({ status: 403, body });
        done();
      },
      complete: () => done.fail('Should not complete'),
    });
  });
});
