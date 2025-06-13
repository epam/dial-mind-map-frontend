import classNames from 'classnames';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSupersub from 'remark-supersub';

import { NodeReference } from '@/types/graph';

import { MemoizedReactMarkdown } from '../../chat/conversation/messages/markdown/MemoizedReactMarkdown';

export const NodeContent = ({
  reference,
  isFullscreenReference,
}: {
  reference: NodeReference;
  isFullscreenReference?: boolean;
}) => {
  const { details } = reference;
  return (
    <div
      className={classNames(
        'flex w-full overflow-y-auto overflow-x-hidden',
        isFullscreenReference ? 'justify-center' : '',
      )}
    >
      <MemoizedReactMarkdown
        className={classNames(
          'prose whitespace-normal dark:prose-invert prose-a:text-accent-primary prose-a:no-underline hover:prose-a:underline',
          isFullscreenReference ? 'text-base' : 'text-xs',
        )}
        remarkPlugins={[remarkGfm, remarkSupersub]}
        rehypePlugins={[rehypeRaw]}
      >
        {details}
      </MemoizedReactMarkdown>
    </div>
  );
};
