import { ChangeEvent, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';

export const useImportAppearance = () => {
  const dispatch = useDispatch();
  const isImportInProgress = useBuilderSelector(AppearanceSelectors.selectIsImportInProgress);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        dispatch(AppearanceActions.importAppearances({ file }));
      }
    },
    [dispatch],
  );

  return {
    isImportInProgress,
    onImportClick,
    onFileChange,
    fileInputRef,
  };
};
