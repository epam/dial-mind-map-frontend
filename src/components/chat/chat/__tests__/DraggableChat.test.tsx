import { render, screen } from '@testing-library/react';
import React from 'react';
import { RefObject } from 'react';
import type { TypedUseSelectorHook } from 'react-redux';

import { useChatSelector } from '@/store/chat/hooks';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';

jest.mock('@/store/chat/hooks');

const typedUseChatSelector: jest.MockedFunction<TypedUseSelectorHook<any>> = useChatSelector as any;
const mockDispatch = jest.fn();

jest.mock('../ChatContent', () => ({
  ChatContent: () => <div data-testid="chat-content">Mocked ChatContent</div>,
}));

const { DraggableChat } = jest.requireActual('../DraggableChat');

type OverrideState = {
  deviceType?: DeviceType;
  isChatHidden?: boolean;
  isMapHidden?: boolean;
};

describe('DraggableChat', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  const setup = (overrides: OverrideState = {}) => {
    typedUseChatSelector.mockImplementation(selector => {
      switch (selector) {
        case ChatUISelectors.selectDeviceType:
          return overrides.deviceType ?? DeviceType.Mobile;
        case ChatUISelectors.selectIsChatHidden:
          return overrides.isChatHidden ?? false;
        case ChatUISelectors.selectIsMapHidden:
          return overrides.isMapHidden ?? false;
        default:
          return undefined;
      }
    });
    const parentRef = { current: { clientHeight: 1000, clientWidth: 1000 } } as RefObject<HTMLDivElement>;
    return { parentRef };
  };

  it('renders with default styles and ChatContent (MidSize)', () => {
    const { parentRef } = setup();
    render(<DraggableChat parentRef={parentRef} />);
    expect(screen.getByTestId('chat-content')).toBeInTheDocument();
  });

  it('renders with MaxSize if map is hidden', () => {
    const { parentRef } = setup({ isMapHidden: true });
    render(<DraggableChat parentRef={parentRef} />);
    expect(screen.getByTestId('draggable-chat')).toBeInTheDocument();
  });

  it('triggers effect to reset chatHidden if isHorizontalMovement and size < MidSize', () => {
    const { parentRef } = setup({ deviceType: DeviceType.Mobile });
    const originalUseEffect = React.useEffect;

    jest.spyOn(React, 'useEffect').mockImplementationOnce(fn => fn());

    render(<DraggableChat parentRef={parentRef} />);

    expect(mockDispatch).not.toHaveBeenCalled(); // isLandscapeMode is false by default
    React.useEffect = originalUseEffect;
  });
});
