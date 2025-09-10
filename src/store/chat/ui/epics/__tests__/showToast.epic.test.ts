import toast from 'react-hot-toast';
import { of } from 'rxjs';

import { ToastType } from '@/types/toasts';

import { ChatUIActions } from '../../ui.reducers';
import { showToastEpic } from '../showToast.epic';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
  },
}));

describe('showToastEpic', () => {
  const DEFAULT_STATE = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls toast.error on Error type with response text', done => {
    const fakeResponse = { status: 400, text: () => Promise.resolve('Bad request') } as any as Response;
    const action = ChatUIActions.showToast({ message: 'X', response: fakeResponse, type: ToastType.Error });

    showToastEpic(of(action), DEFAULT_STATE).subscribe({
      complete: async () => {
        await Promise.resolve();
        expect(toast.error).toHaveBeenCalledWith(
          'Bad request',
          expect.objectContaining({ id: ToastType.Error, className: 'chat-toast', icon: undefined }),
        );
        done();
      },
      error: err => done(err as Error),
    });
  });

  it('calls toast.loading with default message on Warning type without message/response', done => {
    const action = ChatUIActions.showToast({ type: ToastType.Warning });

    showToastEpic(of(action), DEFAULT_STATE).subscribe({
      complete: () => {
        expect(toast.loading).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ id: ToastType.Warning, className: 'chat-toast' }),
        );
        done();
      },
      error: err => done(err as Error),
    });
  });

  it('calls toast.success on Success type', done => {
    const action = ChatUIActions.showToast({ message: 'Done', type: ToastType.Success });

    showToastEpic(of(action), DEFAULT_STATE).subscribe({
      complete: () => {
        expect(toast.success).toHaveBeenCalledWith(
          'Done',
          expect.objectContaining({ id: ToastType.Success, className: 'chat-toast' }),
        );
        done();
      },
      error: err => done(err as Error),
    });
  });

  it('calls toast.loading on Loading and Info types', done => {
    const loadAction = ChatUIActions.showToast({ message: 'Loading', type: ToastType.Loading });
    const infoAction = ChatUIActions.showToast({ message: 'Info', type: ToastType.Info });

    showToastEpic(of(loadAction, infoAction), DEFAULT_STATE).subscribe({
      complete: () => {
        expect(toast.loading).toHaveBeenCalledWith(
          'Loading',
          expect.objectContaining({ id: ToastType.Loading, className: 'chat-toast' }),
        );
        expect(toast.loading).toHaveBeenCalledWith(
          'Info',
          expect.objectContaining({ id: ToastType.Info, className: 'chat-toast' }),
        );
        done();
      },
      error: err => done(err as Error),
    });
  });
});
