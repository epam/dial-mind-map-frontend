import './ImageContent.style.css';

import { useDebounceFn } from 'ahooks';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { ReactZoomPanPinchContentRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { useChatSelector } from '@/store/chat/hooks';
import { DocsReference } from '@/types/graph';

const TOOLTIP_HEADER_HEIGHT = 32; // Height of the tooltip header in pixels
const TOOLTIP_PADDING = 22; // Padding around the tooltip content in pixels

const TOOLTIP_RESERVED_HEIGHT = TOOLTIP_HEADER_HEIGHT + TOOLTIP_PADDING;

export const ImageContent = ({
  reference,
  isFullscreenReference,
  availableHeight,
}: {
  reference: DocsReference;
  isFullscreenReference?: boolean;
  availableHeight?: number | null;
}) => {
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const appName = useChatSelector(ApplicationSelectors.selectApplicationName);
  const { content, doc_name } = reference;

  const withoutExtension = content.slice(0, content.lastIndexOf('.'));
  const imageSrc = `/api/mindmaps/${encodeURIComponent(appName)}/${withoutExtension}`;

  const { run: handleResize } = useDebounceFn(
    () => {
      transformRef.current?.resetTransform();
    },
    { wait: 200 },
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div className="image-wrapper flex size-full items-center justify-center">
      <TransformWrapper
        minScale={1}
        wheel={{
          disabled: false,
          wheelDisabled: false,
          touchPadDisabled: false,
          smoothStep: 0.005,
          step: 0.5,
        }}
        doubleClick={{
          step: 2,
          animationTime: 300,
          mode: 'reset',
        }}
        pinch={{
          disabled: false,
          step: 20,
        }}
        ref={transformRef}
      >
        <TransformComponent contentClass="size-full">
          <img
            src={imageSrc}
            alt={doc_name}
            style={
              !isFullscreenReference && availableHeight
                ? {
                    maxHeight: availableHeight > 300 ? '300px' : `${availableHeight - TOOLTIP_RESERVED_HEIGHT}px`,
                    height: availableHeight > 300 ? '300px' : `${availableHeight - TOOLTIP_RESERVED_HEIGHT}px`,
                  }
                : {}
            }
            className={classNames('w-full object-contain min-h-[200px]', 'max-h-full')}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
