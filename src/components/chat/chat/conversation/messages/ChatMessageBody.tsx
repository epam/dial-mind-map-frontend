import classNames from 'classnames';

import { ErrorMessage } from '@/components/builder/common/ErrorMessage';
import { Space } from '@/components/common/Space/Space';
import { montserrat } from '@/fonts/fonts';
import { useChatSelector } from '@/store/chat/hooks';
import { MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { Message } from '@/types/chat';
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

  if (!message.content && message.errorMessage) {
    return <ErrorMessage error={message.errorMessage} classes="mr-5 text-sm" />;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 xl:gap-4">
      <div
        className={classNames([
          'max-w-full prose dark:prose-invert prose-a:text-accent-primary prose-a:no-underline hover:prose-a:underline text-sm xl:text-base leading-normal md:leading-[1.7]',
          montserrat.className,
        ])}
      >
        <MarkdownRenderer
          text={message.content}
          references={message.references}
          isShowResponseLoader={!!isMessageStreaming && isLastMessage}
        />
      </div>
      {nodes && (
        <Space size={'small'} direction="horizontal" wrap={true}>
          {nodes.map(n => (
            <Node
              id={n.id}
              key={n.id}
              color={n.color}
              label={n.label}
              isPrevious={previousNodeId === n.id}
              isVisited={!!visitedNodes[n.id]}
            />
          ))}
        </Space>
      )}
    </div>
  );
};
