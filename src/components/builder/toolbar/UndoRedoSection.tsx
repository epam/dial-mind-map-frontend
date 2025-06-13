import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { usePlatform } from '@/hooks/usePlatform';
import { HistoryActions, HistorySelectors } from '@/store/builder/history/history.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';
import { Platform } from '@/types/common';

import Tooltip from '../common/Tooltip';

export const UndoRedoSection = ({ buttonClasses }: { buttonClasses: string }) => {
  const dispatch = useDispatch();
  const isRedoAvailable = useBuilderSelector(HistorySelectors.selectIsRedo);
  const isUndoAvailable = useBuilderSelector(HistorySelectors.selectIsUndo);

  const onRedo = useCallback(() => dispatch(HistoryActions.applyAction('redo')), [dispatch]);
  const onUndo = useCallback(() => dispatch(HistoryActions.applyAction('undo')), [dispatch]);

  return (
    <UndoRedo
      isRedoAvailable={isRedoAvailable}
      isUndoAvailable={isUndoAvailable}
      onRedo={onRedo}
      onUndo={onUndo}
      buttonClasses={buttonClasses}
    />
  );
};

const UndoRedo = ({
  buttonClasses,
  isRedoAvailable,
  isUndoAvailable,
  onRedo,
  onUndo,
}: {
  buttonClasses: string;
  isUndoAvailable: boolean;
  isRedoAvailable: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) => {
  const platform = usePlatform();

  return (
    <div className="mx-3 my-[6px] flex gap-2">
      <Tooltip
        tooltip={
          <>
            Undo <span className="italic">{platform === Platform.MAC ? '(⌘+Z)' : '(Ctrl+Z)'}</span>
          </>
        }
        contentClassName="text-sm px-2 text-primary"
      >
        <button className={buttonClasses} disabled={!isUndoAvailable} onClick={onUndo}>
          <IconArrowBackUp height={24} width={24} stroke={1.5} />
        </button>
      </Tooltip>
      <Tooltip
        tooltip={
          <>
            Redo <span className="italic">{platform === Platform.MAC ? '(⌘+Shift+Z)' : '(Ctrl+Shift+Z)'}</span>
          </>
        }
        contentClassName="text-sm px-2 text-primary"
      >
        <button className={buttonClasses} disabled={!isRedoAvailable} onClick={onRedo}>
          <IconArrowForwardUp height={24} width={24} stroke={1.5} />
        </button>
      </Tooltip>
    </div>
  );
};
