import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import { createBuilderStore } from '@/store/builder';

import { GenEdgesDelConfirmModal } from '../GenEdgesDelConfirmModal';

jest.mock('../../../common/Modal', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@epam/ai-dial-shared', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('lodash-es', () => ({
  debounce: (fn: any) => fn,
  throttle: (fn: any) => fn,
}));

jest.mock('@/utils/app/browser-storage', () => ({
  BrowserStorage: {
    init: jest.fn(),
    getData: jest.fn(() => undefined),
    setData: jest.fn(),
  },
}));

const setupStore = () => {
  return createBuilderStore({
    dialApiHost: 'mock-api',
    dialChatHost: 'mock-chat',
    mindmapIframeTitle: 'mock-title',
    isAllowApiKeyAuth: false,
    providers: [],
  });
};

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

describe('GenEdgesDelConfirmModal', () => {
  test('renders the modal with correct text when open', async () => {
    const store = setupStore();
    store.dispatch({ type: 'UI/setIsGenEdgesDelConfirmModalOpen', payload: true });

    render(
      <Provider store={store}>
        <GenEdgesDelConfirmModal />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete all complemented edges?/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  test('does not render modal when closed', async () => {
    const store = setupStore();
    store.dispatch({ type: 'UI/setIsGenEdgesDelConfirmModalOpen', payload: false });

    render(
      <Provider store={store}>
        <GenEdgesDelConfirmModal />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Confirm deletion/i)).not.toBeInTheDocument();
    });
  });

  test('closes modal when Cancel is clicked', async () => {
    const store = setupStore();
    store.dispatch({ type: 'UI/setIsGenEdgesDelConfirmModalOpen', payload: true });

    render(
      <Provider store={store}>
        <GenEdgesDelConfirmModal />
      </Provider>,
    );

    await screen.findByRole('button', { name: /Cancel/i });

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    await waitFor(() => {
      expect(store.getState().ui.isGenEdgesDelConfirmModalOpen).toBe(false);
    });
  });

  test('dispatches delete action when Delete is clicked', async () => {
    const store = setupStore();
    store.dispatch({ type: 'UI/setIsGenEdgesDelConfirmModalOpen', payload: true });

    render(
      <Provider store={store}>
        <GenEdgesDelConfirmModal />
      </Provider>,
    );

    await screen.findByRole('button', { name: /Delete/i });

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(store.getState().ui.isGenEdgesDelConfirmModalOpen).toBe(false);
    });
  });
});
