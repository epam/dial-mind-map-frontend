import classNames from 'classnames';
import { useCallback, useMemo, useRef } from 'react';

import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { ApplicationSelectors } from '@/store/chat/application/application.reducer';
import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { SettingsSelectors } from '@/store/chat/settings/settings.reducers';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { IconResourceKey } from '@/types/customization';
import { Node } from '@/types/graph';

import { DesktopChat } from './chat/DesktopChat';
import { DraggableChat } from './chat/DraggableChat';
import GraphComponent from './graph/GraphComponent';
import { useWebFontReady } from './graph/hooks/useWebFontReady';
import { GraphError } from './GraphError';
import { ReferenceFullscreenView } from './reference/ReferenceFullscreenView';

export const Mindmap = () => {
  const dispatch = useChatDispatch();

  const fullscreenReferences = useChatSelector(MindmapSelectors.selectFullscreenReferences);
  const elements = useChatSelector(MindmapSelectors.selectGraphElements);
  const isReady = useChatSelector(MindmapSelectors.selectIsReady);
  const focusNodeId = useChatSelector(MindmapSelectors.selectFocusNodeId);
  const visitedNodes = useChatSelector(MindmapSelectors.selectVisitedNodes);
  const updateSignal = useChatSelector(MindmapSelectors.selectUpdateSignal);
  const isMapHidden = useChatSelector(ChatUISelectors.selectIsMapHidden);
  const isChatHidden = useChatSelector(ChatUISelectors.selectIsChatHidden);
  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const hasAppReference = useChatSelector(ApplicationSelectors.selectHasAppReference);
  const hasAppProperties = useChatSelector(ApplicationSelectors.selectHasAppProperties);
  const isNotFound = useChatSelector(MindmapSelectors.selectIsNotFound);
  const isRootNodeNotFound = useChatSelector(MindmapSelectors.selectIsRootNodeNotFound);
  const themeConfig = useChatSelector(AppearanceSelectors.selectThemeConfig);
  const isProdEnv = useChatSelector(SettingsSelectors.selectIsProdEnv);

  const viewRef = useRef<HTMLDivElement | null>(null);

  const isDesktop = deviceType === DeviceType.Desktop;
  const chatIsOnLeft = themeConfig?.chat?.chatSide === 'left';

  let fontFamily = themeConfig?.graph?.font?.['font-family'] || themeConfig?.font?.['font-family'] || undefined;

  const { isReady: webFontReady, status: webFontStatus } = useWebFontReady(fontFamily ?? '');

  let isFontReady = !fontFamily || webFontReady;
  if (webFontStatus === 'timeout') {
    fontFamily =
      fontFamily !== themeConfig?.font?.['font-family'] && themeConfig?.font?.['font-family']
        ? themeConfig?.font?.['font-family']
        : undefined;
    isFontReady = true;
  }

  const isGraphReady = hasAppReference && !!themeConfig?.graph && isFontReady;

  const errorTitle = useMemo(() => {
    return isRootNodeNotFound ? 'Root node not set.' : 'Mindmap is not available.';
  }, [isRootNodeNotFound]);

  const errorDescription = useMemo(() => {
    return isRootNodeNotFound ? 'Please configure a root node for your mindmap.' : 'Please generate the graph.';
  }, [isRootNodeNotFound]);

  const handleFocusNode = useCallback(
    (node: Node) => {
      dispatch(MindmapActions.handleNavigation({ clickedNodeId: node.id, shouldFetchGraph: true }));
      dispatch(ConversationActions.setMessageSending({ isMessageSending: false }));
    },
    [dispatch],
  );

  const containerClasses = classNames(
    'relative h-full w-full flex gap-2',
    isDesktop ? (chatIsOnLeft ? 'flex-row-reverse' : 'flex-row') : 'flex-col',
    isMapHidden && 'justify-center items-center',
  );

  const heightClass = useMemo(() => {
    if (isMapHidden) {
      return 'h-full';
    }
    if (!isDesktop && !isChatHidden && fullscreenReferences && !isMapHidden) {
      return 'h-[calc(50%-8px)]';
    }
    if (isChatHidden && !isDesktop) {
      return 'h-[calc(87%-8px)]';
    }
    if (isDesktop) {
      return 'h-full';
    }
    if (!isChatHidden && !fullscreenReferences && !isMapHidden) {
      return 'h-1/2';
    }
  }, [isMapHidden, isChatHidden, fullscreenReferences, isDesktop]);

  const maxHeightClass =
    !isDesktop && isChatHidden && fullscreenReferences && !isMapHidden ? 'max-h-[calc(100%-121px)]' : undefined;

  const mapPaneClasses = classNames(
    !isMapHidden && 'relative',
    !isDesktop && 'w-full',
    isMapHidden ? 'invisible absolute w-full' : null,
    isDesktop && !isMapHidden && 'flex-1 w-2/3',
    heightClass,
    maxHeightClass,
  );

  return (
    <div className={containerClasses} ref={viewRef}>
      <div className={mapPaneClasses}>
        {fullscreenReferences && <ReferenceFullscreenView references={fullscreenReferences} />}
        {!isGraphReady ? null : hasAppProperties && !isNotFound && !isRootNodeNotFound ? (
          <GraphComponent
            graphConfig={themeConfig?.graph}
            fontFamily={fontFamily}
            isReady={isReady}
            elements={elements}
            focusNodeId={focusNodeId}
            isChatHidden={isChatHidden}
            visitedNodes={visitedNodes}
            updateSignal={updateSignal}
            onFocusNodeChange={handleFocusNode}
            robotStorageIcon={themeConfig?.icons?.[IconResourceKey.RobotIcon]}
            arrowBackStorageIcon={themeConfig?.icons?.[IconResourceKey.ArrowBackIcon]}
            isProdEnv={isProdEnv}
          />
        ) : (
          <GraphError title={errorTitle} description={errorDescription} />
        )}
      </div>

      {deviceType === DeviceType.Unknown ? null : isDesktop ? <DesktopChat /> : <DraggableChat parentRef={viewRef} />}
    </div>
  );
};
