import { render, screen } from '@testing-library/react';
import type { TypedUseSelectorHook } from 'react-redux';

import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';

jest.mock('@/store/chat/hooks');

const typedUseChatSelector: jest.MockedFunction<TypedUseSelectorHook<any>> = useChatSelector as any;

jest.mock('../Toolbar', () => ({
  Toolbar: () => <div data-testid="toolbar">Mocked Toolbar</div>,
}));

jest.mock('../ChatContent', () => ({
  ChatContent: () => <div data-testid="chat-content">Mocked ChatContent</div>,
}));

const { DesktopChat } = jest.requireActual('../DesktopChat');

describe('DesktopChat', () => {
  it('renders Toolbar on Desktop', () => {
    typedUseChatSelector.mockImplementation(selector => {
      switch (selector) {
        case ChatUISelectors.selectDeviceType:
          return DeviceType.Desktop;
        case ChatUISelectors.selectIsMapHidden:
          return false;
        default:
          return undefined;
      }
    });
    render(<DesktopChat />);
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-content')).toBeInTheDocument();
  });

  it('does not render Toolbar on Mobile', () => {
    typedUseChatSelector.mockImplementation(selector => {
      switch (selector) {
        case ChatUISelectors.selectDeviceType:
          return DeviceType.Mobile;
        case ChatUISelectors.selectIsMapHidden:
          return false;
        default:
          return undefined;
      }
    });
    render(<DesktopChat />);
    expect(screen.queryByTestId('toolbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-content')).toBeInTheDocument();
  });

  it('applies expanded class when isMapHidden is true', () => {
    typedUseChatSelector.mockImplementation(selector => {
      switch (selector) {
        case ChatUISelectors.selectDeviceType:
          return DeviceType.Desktop;
        case ChatUISelectors.selectIsMapHidden:
          return true;
        default:
          return undefined;
      }
    });
    render(<DesktopChat />);
    expect(screen.getByTestId('desktop-chat')).toHaveClass('xl:w-full');
  });
});
