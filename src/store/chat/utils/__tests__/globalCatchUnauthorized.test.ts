import { throwError } from 'rxjs';

import { chatAuthActions } from '../../chatAuth/chatAuth.slice';
import { globalCatchChatUnauthorized } from '../globalCatchUnauthorized';

describe('globalCatchChatUnauthorized operator', () => {
  it('should catch 401 and emit redirectToSignin action', done => {
    const error = { status: 401, body: {} };
    throwError(() => error)
      .pipe(globalCatchChatUnauthorized())
      .subscribe({
        next: action => {
          expect(action).toEqual(chatAuthActions.redirectToSignin());
          done();
        },
        error: () => done(new Error('Error should have been caught')),
      });
  });

  it('should catch 403 and emit redirectToForbidden action', done => {
    const error = { status: 403, body: {} };
    throwError(() => error)
      .pipe(globalCatchChatUnauthorized())
      .subscribe({
        next: action => {
          expect(action).toEqual(chatAuthActions.redirectToForbidden());
          done();
        },
        error: () => done(new Error('Error should have been caught')),
      });
  });

  it('should rethrow non-401/403 errors', done => {
    const error = { status: 500, message: 'Server error' };
    throwError(() => error)
      .pipe(globalCatchChatUnauthorized())
      .subscribe({
        next: () => done(new Error('Should not emit next')),
        error: err => {
          expect(err).toBe(error);
          done();
        },
      });
  });
});
