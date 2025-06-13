import { ModelCursorSign } from '@/constants/app';

export const BlinkingCursor = ({ isShowing }: { isShowing: boolean }) => {
  return isShowing ? <span className="mt-1 animate-ping cursor-default">{ModelCursorSign}</span> : null;
};
