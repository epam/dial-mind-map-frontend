import './DraggableChat.style.css';

import { useDrag } from '@use-gesture/react';
import classNames from 'classnames';
import { CSSProperties, RefObject, useEffect, useState } from 'react';
import { animated, AnimatedProps, useSpring } from 'react-spring';

import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { ChatUIActions, ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';

import { ChatContent } from './ChatContent';
import { useChatBgImage } from './hooks/useChatBgImage';

const MaxSize = 100;
const MidSize = 50;
const MinSize = 13;

export const DraggableChat = ({ parentRef }: { parentRef: RefObject<HTMLDivElement | null> }) => {
  const dispatch = useChatDispatch();
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isChatHidden = useChatSelector(ChatUISelectors.selectIsChatHidden);
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);
  const { classes: chatBgImageClasses, style: chatBgImageInlineStyles } = useChatBgImage();
  const isLandscapeMode = false;

  const isMobile = deviceType === DeviceType.Mobile;
  const isHorizontalMovement = isLandscapeMode && isMobile;

  const initSize = isChatHidden ? MinSize : isMapHidden ? MaxSize : MidSize;

  const [size, setSize] = useState(initSize);
  const [{ animatedSize }, api] = useSpring(() => ({ animatedSize: `${initSize}%` }), [initSize]);

  useEffect(() => {
    const targetSize = isChatHidden ? MinSize : isMapHidden ? MaxSize : MidSize;

    setSize(targetSize);

    api.start({ animatedSize: `${targetSize}%` });
  }, [isMapHidden, isChatHidden, api]);

  useEffect(() => {
    if (isHorizontalMovement && size < MidSize) {
      setSize(MidSize);
      api.start({ animatedSize: `${MidSize}%` });
      dispatch(ChatUIActions.setIsChatHidden(false));
    }
  }, [isHorizontalMovement, size]);

  const bind = useDrag(
    ({ down, movement: [mx, my], memo = size, event }) => {
      event.preventDefault();

      if (!parentRef.current) return memo;

      const parentDimension = isHorizontalMovement ? parentRef.current.clientWidth : parentRef.current.clientHeight;
      const movement = isHorizontalMovement ? mx : my;

      let newSize = memo - (movement / parentDimension) * 100;
      newSize = Math.max(MinSize, Math.min(MaxSize, newSize));

      const updateStateForSize = (size: number, chatHidden: boolean, mapHidden: boolean) => {
        setSize(size);
        api.start({ animatedSize: `${size}%` });
        dispatch(ChatUIActions.setIsChatHidden(chatHidden));
        dispatch(ChatUIActions.setIsMapHidden(mapHidden));
      };

      if (!down) {
        if (!isHorizontalMovement && newSize < 30) {
          updateStateForSize(MinSize, true, false);
        } else if (newSize > 70) {
          updateStateForSize(MaxSize, false, true);
        } else {
          updateStateForSize(MidSize, false, false);
        }
      } else {
        const animatedSize = isHorizontalMovement && newSize < MidSize ? MidSize : newSize;
        api.start({ animatedSize: `${animatedSize}%` });
      }

      return memo;
    },
    { axis: isHorizontalMovement ? 'x' : 'y' },
  );

  const getStyles = (): AnimatedProps<CSSProperties> => {
    let styles: AnimatedProps<CSSProperties> = {};

    if (isHorizontalMovement) {
      styles = { ...styles, width: animatedSize };
    } else {
      styles = { ...styles, height: animatedSize, minHeight: '113px' };
    }

    if (chatBgImageInlineStyles) {
      styles = { ...styles, ...chatBgImageInlineStyles };
    }

    return styles;
  };

  return (
    <animated.div
      className={classNames([
        'draggable-chat border-primary bg-layer-1 rounded-[10px] border-2 h-full flex flex-col pt-4 absolute w-full bottom-0 z-50 chat-container',
        chatBgImageClasses,
      ])}
      style={getStyles()}
      data-testid="draggable-chat"
    >
      <div {...bind()} className="absolute top-[-7px] h-7 w-full touch-none">
        <div className="absolute left-1/2 top-[13px] h-1 w-[60px] -translate-x-1/2 touch-none rounded-[11px] bg-layer-4 hover:cursor-pointer"></div>
      </div>
      <ChatContent />
    </animated.div>
  );
};
