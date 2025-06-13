import { useHotkeys } from 'react-hotkeys-hook';

import { useBuilderDispatch } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';

import { useHistoryHotKeys } from '../useHistoryHotKeys';

export const useEditorHotkeys = () => {
  const dispatch = useBuilderDispatch();

  useHotkeys(
    ['ctrl+f', 'meta+f'],
    event => {
      event.preventDefault();
      const inputElement = document.getElementById('search-input');
      if (inputElement) {
        inputElement.focus();
      }
    },
    [],
  );

  useHistoryHotKeys();

  useHotkeys(['esc'], () => dispatch(UIActions.setIsNodeEditorOpen(false)));
};
