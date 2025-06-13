import { BlinkingCursor } from '@/components/common/BlinkingCursor';
import { ModelCursorSign } from '@/constants/app';

export const ParagraphRenderer = ({
  children,
  className,
  isShowResponseLoader,
}: {
  children?: React.ReactNode;
  className?: string;
  isShowResponseLoader: boolean;
}) => {
  const child = children as any;

  if (child?.length) {
    const firstChild = child[0] as string;
    if (firstChild === ModelCursorSign) {
      return <BlinkingCursor isShowing={isShowResponseLoader} />;
    }
  }
  return <p className={className}>{child}</p>;
};
