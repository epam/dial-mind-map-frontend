import { ChangeEvent, useCallback } from 'react';

import { AllowedSourceFilesTypesList, BytesInMb } from '@/constants/app';
import { MAX_SOURCE_FILE_SIZE_MB } from '@/constants/settings';
import { useBuilderDispatch } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { CreateSource, Source, SourceType } from '@/types/sources';

import { sanitizeAndReportFiles } from '../utils/files';

interface UseSourceFileUploadProps {
  watchedSources: Source[];
  handleAddSource: (createSource: CreateSource) => Promise<void>;
}

export const useSourceFileUpload = ({ watchedSources, handleAddSource }: UseSourceFileUploadProps) => {
  const dispatch = useBuilderDispatch();

  const handleSelectFiles = useCallback(
    (e: ChangeEvent<HTMLInputElement>, sourceId?: string, versionId?: number) => {
      const chosen = Array.from(e.target.files || []);
      const filtered = sanitizeAndReportFiles(
        chosen,
        dispatch,
        AllowedSourceFilesTypesList,
        MAX_SOURCE_FILE_SIZE_MB * BytesInMb,
      );

      const duplicatesInForm = filtered.filter(f =>
        watchedSources.some(s => s.type === SourceType.FILE && s.name === f.name && sourceId !== s.id),
      );

      if (duplicatesInForm.length) {
        dispatch(
          UIActions.showErrorToast(
            `The files ${duplicatesInForm.map(f => f.name).join(', ')} already exist in the list of sources`,
          ),
        );
      }

      filtered
        .filter(f => !duplicatesInForm.some(d => d.name === f.name))
        .forEach(file => handleAddSource({ file, sourceId, versionId }));

      e.target.value = '';
    },
    [dispatch, handleAddSource, watchedSources],
  );

  return { handleSelectFiles };
};
