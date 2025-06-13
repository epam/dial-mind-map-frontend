import classNames from 'classnames';

import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { DepthType } from '@/store/chat/mindmap/mindmap.types';

export const LevelSwitcher = ({ classes, onChange }: { classes?: string; onChange?: (depth: DepthType) => void }) => {
  const dispatch = useChatDispatch();
  const depth = useChatSelector(MindmapSelectors.selectDepth);

  const buttonClasses =
    'flex h-9 px-3 text-sm items-center justify-center bg-layer-3 hover:bg-layer-2 hover:text-accent-primary transition-colors duration-200';

  return (
    <div className={classNames([classes])}>
      <div className="flex gap-px rounded-lg bg-layer-1">
        <button
          className={classNames([buttonClasses, 'rounded-l-lg', depth === 1 && 'text-accent-primary'])}
          onClick={() => {
            onChange?.(1);
            if (depth !== 1) {
              dispatch(MindmapActions.setDepth(1));
              dispatch(MindmapActions.fetchGraph());
            }
          }}
        >
          1-level
        </button>
        <button
          className={classNames([buttonClasses, 'rounded-r-lg', depth === 2 && 'text-accent-primary'])}
          onClick={() => {
            onChange?.(2);
            if (depth !== 2) {
              dispatch(MindmapActions.setDepth(2));
              dispatch(MindmapActions.fetchGraph());
            }
          }}
        >
          2-level
        </button>
      </div>
    </div>
  );
};
