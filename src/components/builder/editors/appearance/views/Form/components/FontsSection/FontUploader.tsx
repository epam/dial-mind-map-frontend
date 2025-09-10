import { IconLoader, IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { sanitizeAndReportFiles } from '@/components/builder/editors/sources/utils/files';
import { AllowedFontsExtensions, BytesInKb } from '@/constants/app';
import { MAX_FONT_FILE_SIZE_KB } from '@/constants/settings';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import {
  UploadResourceStatusActions,
  UploadResourceStatusSelectors,
} from '@/store/builder/uploadResourceStatus/uploadResourceStatus.reducers';
import { prepareFileName, prepareStorageFontFileName } from '@/utils/app/file';

interface FontUploaderProps {
  uploadKey: string;
  fontName?: string;
  onSelect: (file: File, preparedName: string) => void;
  onSuccessUpload: (fontFileName: string, fontFamily: string) => void;
  onDelete: () => void;
}

export const FontUploader = ({ fontName, uploadKey, onSelect, onSuccessUpload, onDelete }: FontUploaderProps) => {
  const dispatch = useBuilderDispatch();
  const [name, setName] = useState(fontName ?? '');
  const [storageName, setStorageName] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const uploadStatus = useBuilderSelector(UploadResourceStatusSelectors.selectUploadStatus(uploadKey));

  useEffect(() => {
    setName(fontName ?? '');
    setStorageName('');
  }, [fontName]);

  const handleSelectFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const filteredFiles = sanitizeAndReportFiles(
        files,
        dispatch,
        ['*/*'],
        MAX_FONT_FILE_SIZE_KB * BytesInKb,
        AllowedFontsExtensions,
      );

      const file = filteredFiles[0];
      if (!file) return;

      const preparedName = prepareStorageFontFileName(file.name);
      setStorageName(preparedName);
      setName(prepareFileName(file.name)); // shown to user
      onSelect(file, preparedName);

      e.target.value = '';
    },
    [dispatch, onSelect],
  );

  const handleDelete = useCallback(() => {
    setName('');
    setUploadedFileName(null);
    dispatch(UploadResourceStatusActions.clearUploadStatus({ key: uploadKey }));
    onDelete();
  }, [dispatch, onDelete, uploadKey]);

  useEffect(() => {
    if (uploadStatus.success) {
      setUploadedFileName(null);
      dispatch(UploadResourceStatusActions.clearUploadStatus({ key: uploadKey }));
      onSuccessUpload(storageName, uploadStatus.response ?? '');
    }
  }, [uploadStatus.success, uploadedFileName, dispatch, onSuccessUpload, uploadKey, storageName]);

  return (
    <label className="input-form peer m-0 block w-fit min-w-[340px] px-3 text-sm hover:border-primary focus:border-accent-primary">
      <div className={classNames(['flex justify-between gap-2', !name && 'text-secondary'])}>
        {name || 'No custom font'}
        <div className="flex items-center gap-2">
          {!uploadStatus.inProgress && (
            <span className="cursor-pointer text-accent-primary">{name ? 'Change' : 'Upload'}</span>
          )}
          {uploadStatus.inProgress && <IconLoader className="animate-spin text-accent-primary" size={18} />}
          {name && !uploadStatus.inProgress && (
            <div
              onClick={event => {
                event.preventDefault();
                handleDelete();
              }}
            >
              <IconX className="cursor-pointer text-secondary hover:text-accent-primary" size={18} />
            </div>
          )}
        </div>
      </div>
      <input
        id="file"
        type="file"
        className="hidden"
        onChange={handleSelectFile}
        accept={AllowedFontsExtensions.join(',')}
      />
    </label>
  );
};
