import classNames from 'classnames';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSupersub from 'remark-supersub';

import { DocsReference } from '@/types/graph';

import { LinkRenderer } from '../../chat/conversation/messages/markdown/elements/LinkRenderer';
import { ParagraphRenderer } from '../../chat/conversation/messages/markdown/elements/ParagraphRenderer';
import { MemoizedReactMarkdown } from '../../chat/conversation/messages/markdown/MemoizedReactMarkdown';

export const MarkdownContent = ({
  reference,
  isFullscreenReference,
}: {
  reference: DocsReference;
  isFullscreenReference?: boolean;
}) => {
  const { content } = reference;

  return (
    <div
      className={classNames(
        'scrollable-content scrollbar-hide px-2',
        isFullscreenReference ? 'flex justify-center max-h-full' : 'max-h-[280px]',
      )}
    >
      <MemoizedReactMarkdown
        className={classNames(
          'prose whitespace-normal dark:prose-invert prose-a:text-accent-primary prose-a:no-underline hover:prose-a:underline break-words',
          isFullscreenReference ? 'text-base max-w-full' : 'text-xs',
        )}
        remarkPlugins={[remarkGfm, remarkSupersub]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: LinkRenderer,
          p: props => <ParagraphRenderer {...props} className=" whitespace-normal" isShowResponseLoader={false} />,
        }}
      >
        {content}
      </MemoizedReactMarkdown>
    </div>
  );
};
