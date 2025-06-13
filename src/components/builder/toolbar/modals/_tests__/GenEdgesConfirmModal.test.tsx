import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import { createBuilderStore } from '@/store/builder';

import { GenEdgesConfirmModal } from '../GenEdgesConfirmModal';

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

describe('GenEdgesConfirmModal', () => {
  test('renders the modal with correct text', async () => {
    const store = setupStore();
    store.dispatch({ type: 'UI/setIsGenEdgesConfirmModalOpen', payload: true });

    render(
      <Provider store={store}>
        <GenEdgesConfirmModal />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Complement edges/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Complement edges to complete the graph/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complement/i })).toBeInTheDocument();
  });

  test('closes modal when Cancel is clicked', async () => {
    const store = setupStore();
    store.dispatch({ type: 'UI/setIsGenEdgesConfirmModalOpen', payload: true });

    render(
      <Provider store={store}>
        <GenEdgesConfirmModal />
      </Provider>,
    );

    await screen.findByRole('button', { name: /Cancel/i });

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    await waitFor(() => {
      expect(store.getState().ui.isGenEdgesConfirmModalOpen).toBe(false);
    });
  });

  test('dispatches actions when Complement is clicked', async () => {
    const store = setupStore();
    store.dispatch({ type: 'UI/setIsGenEdgesConfirmModalOpen', payload: true });

    render(
      <Provider store={store}>
        <GenEdgesConfirmModal />
      </Provider>,
    );

    await screen.findByRole('button', { name: /Complement/i });

    fireEvent.click(screen.getByRole('button', { name: /Complement/i }));

    await waitFor(() => {
      expect(store.getState().ui.isGenEdgesConfirmModalOpen).toBe(false);
    });
    expect(store.getState().preferences.isGenEdgesConfirmModalSkipped).toBe(false);
  });

  test('updates checkbox state correctly', async () => {
    const store = setupStore();

    render(
      <Provider store={store}>
        <GenEdgesConfirmModal />
      </Provider>,
    );
    await screen.findByRole('checkbox');

    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });
});
