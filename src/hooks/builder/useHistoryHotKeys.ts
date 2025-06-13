import { useHotkeys } from 'react-hotkeys-hook';

import { HistoryActions, HistorySelectors } from '@/store/builder/history/history.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';

export const useHistoryHotKeys = () => {
  const dispatch = useBuilderDispatch();
  const isRedoAvailable = useBuilderSelector(HistorySelectors.selectIsRedo);
  const isUndoAvailable = useBuilderSelector(HistorySelectors.selectIsUndo);

  useHotkeys(['ctrl+z', 'meta+z'], () => dispatch(HistoryActions.applyAction('undo')), { enabled: isUndoAvailable }, [
    dispatch,
  ]);
  useHotkeys(
    ['ctrl+shift+z', 'meta+shift+z'],
    () => dispatch(HistoryActions.applyAction('redo')),
    { enabled: isRedoAvailable },
    [dispatch],
  );
};
