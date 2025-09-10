import classNames from 'classnames';

import { useChatDispatch, useChatSelector } from '@/store/chat/hooks';
import { MindmapActions, MindmapSelectors } from '@/store/chat/mindmap/mindmap.reducers';
import { DepthType } from '@/store/chat/mindmap/mindmap.types';
import { PlaybackSelectors } from '@/store/chat/playback/playback.selectors';

export const LevelSwitcher = ({ classes, onChange }: { classes?: string; onChange?: (depth: DepthType) => void }) => {
  const dispatch = useChatDispatch();
  const depth = useChatSelector(MindmapSelectors.selectDepth);
  const isPlayback = useChatSelector(PlaybackSelectors.selectIsPlayback);

  const baseButtonClasses =
    'flex h-9 px-3 text-sm items-center justify-center bg-layer-3 hover:bg-layer-4 hover:text-accent-primary transition-colors duration-200 level-switcher__button';

  return (
    <div className={classNames(classes)}>
      <div className="level-switcher flex gap-px rounded-[10px] bg-layer-1">
        <button
          className={classNames([
            baseButtonClasses,
            'rounded-l-[10px]',
            depth === 1 && 'text-accent-primary level-switcher__button--active',
            isPlayback && 'pointer-events-none',
          ])}
          disabled={isPlayback}
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
          className={classNames([
            baseButtonClasses,
            'rounded-r-[10px]',
            depth === 2 && 'text-accent-primary level-switcher__button--active',
            isPlayback && 'pointer-events-none',
          ])}
          disabled={isPlayback}
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
