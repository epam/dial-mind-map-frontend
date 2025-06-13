import './ImageContent.style.css';

import { useDebounceFn } from 'ahooks';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { ReactZoomPanPinchContentRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import { DeviceType } from '@/store/chat/ui/ui.reducers';
import { DocsReference } from '@/types/graph';
import { constructPath } from '@/utils/app/file';

export const ImageContent = ({
  reference,
  folderPath,
  isFullscreenReference,
}: {
  reference: DocsReference;
  folderPath: string;
  isFullscreenReference?: boolean;
  deviceType: DeviceType;
}) => {
  const { content, doc_name } = reference;
  const imageSrc = `/${constructPath('api', folderPath, content)}`;
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);

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
            className={classNames('w-full max-h-full object-contain', !isFullscreenReference && 'h-[300px]')}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
