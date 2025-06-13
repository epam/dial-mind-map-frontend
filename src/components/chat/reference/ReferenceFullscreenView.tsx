import classNames from 'classnames';
import { useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import Slider from 'react-slick';

import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { DocsReference, NodeReference } from '@/types/graph';

import { ReferenceHeader } from './components/ReferenceHeader';
import { useReferenceSlider } from './hooks/useReferenceSlider';

interface Props {
  references: Array<DocsReference | NodeReference>;
  mindmapFolder: string;
}

export const ReferenceFullscreenView: React.FC<Props> = ({ references, mindmapFolder }) => {
  const dispatch = useChatDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenInitialSlide = useChatSelector(MindmapSelectors.selectFullscreenInitialSlide);

  const onCloseFullscreenReferences = () => {
    dispatch(MindmapActions.setFullscreenReferences(null));
    dispatch(MindmapActions.setFullscreenInitialSlide(null));
  };

  useHotkeys(['esc'], () => onCloseFullscreenReferences());

  const { Title, current, prev, next, sliderRef, slides, settings } = useReferenceSlider({
    references,
    mindmapFolder,
    isFullscreen: true,
    containerRef,
    initialSlideNumber: fullscreenInitialSlide ?? 0,
  });

  return (
    <div
      className={classNames(
        'absolute size-full left-0 top-0 z-40 rounded-lg border-2 border-primary bg-layer-0 shadow flex flex-col',
      )}
    >
      <div className="flex-none border-b border-secondary">
        <ReferenceHeader
          title={Title}
          current={current}
          total={references.length}
          onPrev={prev}
          onNext={next}
          onCloseFullscreen={onCloseFullscreenReferences}
        />
      </div>

      <div className="h-full flex-1 overflow-visible" ref={containerRef}>
        <Slider ref={sliderRef} {...settings} className="fullscreen-slider h-full">
          {slides}
        </Slider>
      </div>
    </div>
  );
};
