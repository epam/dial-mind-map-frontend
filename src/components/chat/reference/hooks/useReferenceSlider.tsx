import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Slider, { Settings } from 'react-slick';

import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions } from '@/store/chat/mindmap/mindmap.reducers';
import { ReferenceActions } from '@/store/chat/reference/reference.reducers';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { DocsReference, NodeReference } from '@/types/graph';
import { SourceType } from '@/types/sources';

import { Node } from '../../chat/conversation/messages/Node';
import { BranchColorsMap } from '../../graph/options';
import { ImageContent } from '../components/ImageContent';
import { MarkdownContent } from '../components/MarkdownContent';
import { NodeContent } from '../components/NodeContent';
import { PdfContent } from '../components/PdfContent';
import { isDocsReference, isNodeReference } from '../components/utils/parseReference';

const makeSettings = (
  onAfterChange: (i: number) => void,
  count: number,
  containerRef?: React.RefObject<HTMLDivElement>,
): Settings => ({
  dots: false,
  arrows: false,
  infinite: count > 1,
  speed: 200,
  slidesToShow: 1,
  slidesToScroll: 1,
  draggable: false,
  swipe: true,
  touchMove: true,
  touchThreshold: 100,
  waitForAnimate: true,
  afterChange: (i: number) => {
    onAfterChange(i);
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  adaptiveHeight: false,
});

const getSlideContent = (
  reference: DocsReference | NodeReference,
  mindmapFolder: string,
  deviceType: DeviceType,
  isFullscreen?: boolean,
) => {
  if (isDocsReference(reference)) {
    if (reference.doc_content_type === 'application/pdf' && isFullscreen) {
      return {
        content: (
          <PdfContent reference={reference} folderPath={mindmapFolder} initialPage={Number(reference.chunk_id) - 1} />
        ),
        contentType: 'pdf',
      };
    }
    return reference.content_type === 'image/jpeg'
      ? ({
          content: (
            <ImageContent
              reference={reference}
              folderPath={mindmapFolder}
              isFullscreenReference={isFullscreen}
              deviceType={deviceType}
            />
          ),
          contentType: 'image',
        } as const)
      : ({
          content: <MarkdownContent reference={reference} isFullscreenReference={isFullscreen} />,
          contentType: 'markdown',
        } as const);
  }
  if (isNodeReference(reference)) {
    return { content: <NodeContent reference={reference} isFullscreenReference={isFullscreen} />, contentType: 'node' };
  }
  return null;
};

export const useReferenceSlider = ({
  setOpenTooltip,
  references,
  mindmapFolder,
  isFullscreen = false,
  containerRef,
  initialSlideNumber = 0,
}: {
  setOpenTooltip?: (state: boolean) => void;
  references: Array<DocsReference | NodeReference>;
  mindmapFolder: string;
  isFullscreen?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  initialSlideNumber?: number;
}) => {
  const [current, setCurrent] = useState(initialSlideNumber);
  const sliderRef = useRef<Slider>(null);
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);

  const dispatch = useChatDispatch();

  const settings = useMemo(
    () => makeSettings(setCurrent, references.length, containerRef),
    [containerRef, references.length],
  );

  const currentReference = useMemo(() => {
    const currentReference = references[current];
    return currentReference;
  }, [references, current]);

  useEffect(() => {
    setCurrent(initialSlideNumber);
    sliderRef.current?.slickGoTo(initialSlideNumber);
  }, [references, initialSlideNumber]);

  const Title = useMemo(() => {
    if (isDocsReference(currentReference)) {
      const name = currentReference.doc_name.split('/').at(-1) || currentReference.doc_name.split('/').at(-2);
      if (currentReference.doc_type === SourceType.LINK) {
        return (
          <a
            href={currentReference.doc_url}
            target="_blank"
            rel="noopener noreferrer text-accent-primary"
            className="truncate text-accent-primary"
          >
            {currentReference.doc_url}
          </a>
        );
      }
      if (currentReference.doc_content_type === 'text/html') {
        return <span className="truncate text-primary">{name}</span>;
      }
      return (
        <button
          onClick={() => {
            dispatch(
              ReferenceActions.downloadSource({
                versionId: currentReference.version,
                sourceId: currentReference.doc_id,
                name: name,
              }),
            );
          }}
          className="truncate text-accent-primary"
        >
          {name}
        </button>
      );
    }
    if (isNodeReference(currentReference)) {
      return (
        <Node
          size="small"
          isVisited={false}
          id={currentReference.id}
          label={currentReference.label}
          isPrevious={false}
          color={BranchColorsMap['#046280']}
          closeTooltip={() => setOpenTooltip && setOpenTooltip(false)}
        />
      );
    }
    return null;
  }, [currentReference, setOpenTooltip, dispatch]);

  const slides = useMemo(
    () =>
      references.map((reference, index) => {
        const key = isDocsReference(reference) ? reference.doc_name : reference.id;
        const slide = getSlideContent(reference, mindmapFolder, deviceType, isFullscreen);
        if (!slide) return null;
        const { content, contentType } = slide;
        return (
          <div key={key} className="flex h-full flex-col">
            <div
              className={classNames(
                'h-full max-h-full',
                contentType !== 'pdf' && 'px-4 py-2',
                !isFullscreen && (contentType === 'pdf' || contentType === 'image') && 'cursor-zoom-in',
              )}
              onClick={() => {
                if (!isFullscreen && (contentType === 'pdf' || contentType === 'image')) {
                  if (setOpenTooltip) {
                    setOpenTooltip(false);
                  }
                  dispatch(MindmapActions.setFullscreenReferences(references));
                  dispatch(MindmapActions.setFullscreenInitialSlide(index));
                }
              }}
            >
              {content}
            </div>
          </div>
        );
      }),
    [references, mindmapFolder, isFullscreen, setOpenTooltip, dispatch],
  );

  const prev = useCallback(() => {
    sliderRef.current?.slickPrev();
  }, []);

  const next = useCallback(() => {
    sliderRef.current?.slickNext();
  }, []);

  return {
    current,
    setCurrent,
    next,
    prev,
    slides,
    sliderRef,
    Title,
    settings,
  };
};
