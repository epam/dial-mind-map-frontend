import isEqual from 'lodash-es/isEqual';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkSupersub from 'remark-supersub';

import { ModelCursorSign } from '@/constants/app';
import { Reference } from '@/types/graph';

import { ImageRenderer } from './elements/ImageRenderer';
import { LinkRenderer } from './elements/LinkRenderer';
import { ParagraphRenderer } from './elements/ParagraphRenderer';
import { ReferenceRenderer } from './elements/ReferenceRenderer';

interface MarkdownRendererProps {
  text: string;
  references?: Reference;
  isShowResponseLoader: boolean;
  messageId?: string;
}

const MarkdownRenderer = ({ text, references, isShowResponseLoader, messageId }: MarkdownRendererProps) => {
  const modifiedText = text.replaceAll('^^[', '||[').replaceAll(']^.', ']^');
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkSupersub]}
      rehypePlugins={[rehypeRaw]}
      components={{
        img: ImageRenderer,
        a: LinkRenderer,
        sup: props => <ReferenceRenderer {...props} references={references} messageId={messageId} />,
        p: props => (
          <ParagraphRenderer
            {...props}
            className="whitespace-normal break-words"
            isShowResponseLoader={isShowResponseLoader}
          />
        ),
        code: props => <code className="text-xs" {...props} />,
      }}
    >
      {`${modifiedText}${isShowResponseLoader ? ModelCursorSign : ''}`}
    </ReactMarkdown>
  );
};

const areEqual = (prevProps: MarkdownRendererProps, nextProps: MarkdownRendererProps) => {
  return (
    prevProps.text === nextProps.text &&
    isEqual(prevProps.references, nextProps.references) &&
    prevProps.isShowResponseLoader === nextProps.isShowResponseLoader
  );
};

export default memo(MarkdownRenderer, areEqual);
