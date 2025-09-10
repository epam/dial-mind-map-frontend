import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';

export const useImportMindmap = () => {
  const dispatch = useDispatch();
  const isImportMindmapInProgress = useBuilderSelector(BuilderSelectors.selectIsMindmapImportInProgress);
  const [isImportMindmapConfirmModalOpen, setIsImportMindmapConfirmModalOpen] = useState(false);

  const fileMindmapInputRef = useRef<HTMLInputElement>(null);

  const onImportMindmapClick = () => {
    fileMindmapInputRef.current?.click();
  };

  const onFileMindmapChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        dispatch(BuilderActions.importMindmap({ file }));
      }
    },
    [dispatch],
  );

  return {
    isImportMindmapInProgress,
    onImportMindmapClick,
    onFileMindmapChange,
    fileMindmapInputRef,
    isImportMindmapConfirmModalOpen,
    setIsImportMindmapConfirmModalOpen,
  };
};
