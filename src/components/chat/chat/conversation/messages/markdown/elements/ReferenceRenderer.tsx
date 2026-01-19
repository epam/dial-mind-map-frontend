import classNames from 'classnames';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import ReferenceTooltip from '@/components/chat/reference/components/ReferenceTooltip';
import { isDocsId, isDocsReference, parseReference } from '@/components/chat/reference/components/utils/parseReference';
import { useBuilderSelector } from '@/store/builder/hooks';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatUIActions, ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { DocsReference, NodeReference, Reference } from '@/types/graph';
import { getReferenceName } from '@/utils/app/references';

export const ReferenceRenderer = ({
  children,
  references,
  messageId,
}: {
  children?: React.ReactNode;
  references?: Reference;
  messageId?: string;
}) => {
  const dispatch = useChatDispatch();
  const activeFullscreenReferenceId = useChatSelector(MindmapSelectors.selectActiveFullscreenReferenceId);
  const fullscreenReferences = useBuilderSelector(MindmapSelectors.selectFullscreenReferences);
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isDesktop = deviceType === DeviceType.Desktop;

  const rawText = children?.toString() ?? '';
  const tokens = rawText.split('||');
  const referenceId = useMemo(() => `${rawText}__${messageId}`, [rawText, messageId]);

  const isActiveFullscreenReference = useMemo(
    () => activeFullscreenReferenceId === referenceId,
    [activeFullscreenReferenceId, referenceId],
  );

  const found = useMemo(() => {
    return tokens
      .map(token => {
        const ids = parseReference(token, references);
        if (!ids) return;
        return isDocsId(ids)
          ? references?.docs.find(
              document =>
                document.doc_id === ids.docId && document.chunk_id === ids.chunkId && document.version === ids.version,
            )
          : references?.nodes.find(n => n.id === ids.nodeId);
      })
      .filter((r): r is DocsReference | NodeReference => !!r);
  }, [tokens, references]);

  const containerRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [wrapped, setWrapped] = useState(false);

  const first = found[0];
  const baseLabel = isDocsReference(first) ? getReferenceName(first) : first?.label;
  const badgeLabel = found?.length > 1 ? `${baseLabel} +${found.length - 1}` : baseLabel;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const badge = badgeRef.current;
    if (!container || !badge) return;

    const updateWrapped = () => {
      setWrapped(badge.getBoundingClientRect().top - container.getBoundingClientRect().top > 10);
    };

    updateWrapped();
    window.addEventListener('resize', updateWrapped);
    return () => window.removeEventListener('resize', updateWrapped);
  }, [rawText, badgeLabel]);

  const setFullscreenReferences = useCallback(() => {
    dispatch(MindmapActions.setFullscreenInitialSlide(0));
    dispatch(MindmapActions.setFullscreenReferences(found));
    dispatch(MindmapActions.setActiveFullscreenReferenceId(referenceId));
    if (isMapHidden) {
      dispatch(ChatUIActions.setIsMapHidden(false));
    }
  }, [dispatch, found, isMapHidden, referenceId]);

  if (!references || !found.length) {
    return <span className="text-secondary">{rawText}</span>;
  }

  const badgeClassName = classNames(
    'reference-badge',
    'whitespace-nowrap max-w-full truncate',
    'inline-block cursor-pointer rounded-full px-2 align-middle',
    !wrapped && (isDesktop ? 'ml-2' : 'ml-1'),
    'relative top-[-2px]',
    isDesktop ? 'text-xxs leading-[2]' : 'text-[9px] leading-[1.8]',
    isActiveFullscreenReference && 'selected',
  );

  return (
    <>
      <span ref={containerRef} className="relative inline-block h-[1em] align-middle" />
      {fullscreenReferences ? (
        <span className="relative inline-block max-w-full align-middle">
          <span ref={badgeRef} className={badgeClassName} onClick={setFullscreenReferences}>
            {badgeLabel}
          </span>
        </span>
      ) : (
        <Tooltip
          tooltip={<ReferenceTooltip references={found} referenceId={referenceId} badgeRef={badgeRef} />}
          triggerClassName="inline-block align-middle max-w-full"
          contentClassName="p-0 rounded-lg xxs:w-[280px] sm:w-fit sm:max-w-[500px] shadow-none"
          isTriggerClickable
        >
          <span className="relative inline-block max-w-full align-middle">
            <span ref={badgeRef} className={badgeClassName}>
              {badgeLabel}
            </span>
          </span>
        </Tooltip>
      )}
    </>
  );
};
