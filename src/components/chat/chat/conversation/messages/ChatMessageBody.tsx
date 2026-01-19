import classNames from 'classnames';

import { ErrorMessage } from '@/components/builder/common/ErrorMessage';
import { Space } from '@/components/common/Space/Space';
import { AppearanceSelectors } from '@/store/chat/appearance/appearance.reducers';
import { useChatSelector } from '@/store/chat/hooks';
import { MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { ChatUISelectors, DeviceType } from '@/store/chat/ui/ui.reducers';
import { Message } from '@/types/chat';
import { ChatNodeResourceKey, ChatNodeType, IconResourceKey } from '@/types/customization';
import { ColoredNode } from '@/types/graph';

import MarkdownRenderer from './markdown/MarkdownRenderer';
import { Node } from './Node';

interface Props {
  message: Message;
  nodes?: ColoredNode[];
  isLastMessage: boolean;
  isMessageStreaming?: boolean;
}

export const ChatMessageBody = ({ nodes, message, isMessageStreaming, isLastMessage }: Props) => {
  const visitedNodes = useChatSelector(MindmapSelectors.selectVisitedNodes);
  const focusNodeId = useChatSelector(MindmapSelectors.selectFocusNodeId);
  const previousNodeId = visitedNodes[focusNodeId];
  const themeConfig = useChatSelector(AppearanceSelectors.selectThemeConfig);
  const chatNodeThemeConfig = themeConfig?.chat?.chatNode;
  const arrowBackIconName = themeConfig?.icons?.[IconResourceKey.ArrowBackIcon];
  const visitedNodesIds = Object.entries(visitedNodes).flatMap(([key, value]) => [key, value]);

  const deviceType = useChatSelector(ChatUISelectors.selectDeviceType);
  const isDesktop = deviceType === DeviceType.Desktop;
  const isTablet = deviceType === DeviceType.Tablet;
  const isMdUp = isTablet || isDesktop;

  if (!message.content && message.errorMessage) {
    return <ErrorMessage error={message.errorMessage} classes="mr-5 text-sm" />;
  }

  return (
    <div className={classNames('flex min-w-0 flex-1 flex-col', isDesktop ? 'gap-4' : 'gap-3')}>
      <div
        className={classNames(
          'max-w-full prose dark:prose-invert prose-a:text-accent-primary prose-a:no-underline hover:prose-a:underline',
          isDesktop ? 'text-base' : 'text-sm',
          isMdUp ? 'leading-[1.7]' : 'leading-normal',
        )}
      >
        <MarkdownRenderer
          text={message.content}
          references={message.references}
          isShowResponseLoader={!!isMessageStreaming && isLastMessage}
          messageId={message.id}
        />
      </div>
      {nodes && (
        <Space size={'small'} direction="horizontal" wrap={true} className="chat-conversation__message-nodes">
          {nodes.map(n => (
            <Node
              id={n.id}
              key={n.id}
              color={n.color}
              textColor={n.textColor}
              label={n.label}
              isPrevious={previousNodeId === n.id}
              isVisited={visitedNodesIds.includes(n.id)}
              type={chatNodeThemeConfig?.availableNodeType ?? ChatNodeType.Filled}
              radius={chatNodeThemeConfig?.['corner-radius']}
              borderColor={n.borderColor}
              arrowBackIconName={arrowBackIconName}
              image={n.image}
              maskImage={chatNodeThemeConfig?.[ChatNodeResourceKey.MaskImg]}
              hasVisitedOpacity={
                !themeConfig?.graph?.paletteSettings?.branchesColors?.[n.branchColorIndex]?.visitedTextColor
              }
            />
          ))}
        </Space>
      )}
    </div>
  );
};
