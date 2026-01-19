import { useDrop } from 'ahooks';
import { DragEvent, useCallback, useState } from 'react';

import { AllowedSourceFilesTypesList, BytesInMb } from '@/constants/app';
import { MAX_SOURCE_FILE_SIZE_MB } from '@/constants/settings';
import { useBuilderDispatch } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { Source, SourceType } from '@/types/sources';
import { ToastType } from '@/types/toasts';

import { sanitizeAndReportFiles } from '../utils/files';

interface UseSourceFileDropProps {
  watchedSources: Source[];
  handleAddSources: (files: File[]) => void;
}

export const useSourceFileDrop = ({ watchedSources, handleAddSources }: UseSourceFileDropProps) => {
  const dispatch = useBuilderDispatch();
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (e?: DragEvent<Element>) => {
      if (!e) return;
      e.preventDefault();
      setIsDragging(false);

      const fileList = e.dataTransfer?.files;
      if (!fileList || fileList.length === 0) return;

      const chosen = Array.from(fileList);
      const filtered = sanitizeAndReportFiles(
        chosen,
        dispatch,
        AllowedSourceFilesTypesList,
        MAX_SOURCE_FILE_SIZE_MB * BytesInMb,
        undefined,
        true,
      );

      const duplicates = filtered.filter(f =>
        watchedSources.some(s => s.type === SourceType.FILE && s.name === f.name),
      );
      if (duplicates.length) {
        dispatch(
          UIActions.showToast({
            message: `Files ${duplicates.map(d => d.name).join(', ')} already exist`,
            type: ToastType.Error,
            duration: 1500,
          }),
        );
      }

      const uniqueFiles = filtered.filter(f => !duplicates.some(d => d.name === f.name));
      if (uniqueFiles.length > 0) {
        handleAddSources(uniqueFiles);
      }
      e.dataTransfer.clearData();
    },
    [dispatch, handleAddSources, watchedSources],
  );

  useDrop(document.documentElement, {
    onDragEnter: e => {
      // only trigger on real file drags
      if (e?.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    },
    onDragOver: e => {
      if (e?.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    },
    onDragLeave: e => {
      // when leaving a files-drag, hide again
      if (e?.dataTransfer?.types.includes('Files')) {
        setIsDragging(false);
      }
    },
    onDrop,
  });

  return { isDragging };
};
