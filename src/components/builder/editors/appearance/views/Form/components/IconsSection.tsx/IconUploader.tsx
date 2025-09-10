import { IconLoader, IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { sanitizeAndReportFiles } from '@/components/builder/editors/sources/utils/files';
import { AllowedIconsTypes, BytesInKb } from '@/constants/app';
import { MAX_NODE_ICON_FILE_SIZE_KB } from '@/constants/settings';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import {
  UploadResourceStatusActions,
  UploadResourceStatusSelectors,
} from '@/store/builder/uploadResourceStatus/uploadResourceStatus.reducers';
import { prepareFileName } from '@/utils/app/file';
import { getAppearanceFileUrl } from '@/utils/app/themes';

interface IconUploaderProps {
  type: string;
  label: string;
  value?: string;
  defaultIcon?: React.ReactNode;
  onSelect: (fileName: string, file: File) => void;
  onDelete: () => void;
  onSuccessUpload: (fileName: string) => void;
  placeholder?: string;
  imageContainerClassName?: string;
}

export const IconUploader = ({
  value,
  label,
  defaultIcon,
  type,
  onSelect,
  onDelete,
  onSuccessUpload,
  placeholder = 'No custom icon',
  imageContainerClassName,
}: IconUploaderProps) => {
  const dispatch = useBuilderDispatch();
  const uploadStatus = useBuilderSelector(UploadResourceStatusSelectors.selectUploadStatus(type));
  const theme = useBuilderSelector(UISelectors.selectTheme);
  const appName = useBuilderSelector(ApplicationSelectors.selectApplicationName);
  const appFolder = useBuilderSelector(ApplicationSelectors.selectMindmapFolder);

  const [name, setName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const fileName = value.split('/').pop() || 'icon';
      setName(fileName);
      setPreviewUrl(getAppearanceFileUrl(appName, theme, value, appFolder));
    } else {
      setName('');
      setPreviewUrl(null);
    }
  }, [value]);

  const handleSelectFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const filteredFiles = sanitizeAndReportFiles(
        files,
        dispatch,
        AllowedIconsTypes,
        MAX_NODE_ICON_FILE_SIZE_KB * BytesInKb,
      );

      const file = filteredFiles[0];
      if (!file) return;

      const fileName = prepareFileName(file.name);
      setName(fileName);
      setUploadedFileName(fileName);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      onSelect(fileName, file);

      e.target.value = '';
    },
    [dispatch, type, onSelect],
  );

  const handleDeleteFile = useCallback(() => {
    onDelete();

    setName('');
    if (previewUrl && !value) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl, value, onDelete]);

  useEffect(() => {
    return () => {
      if (previewUrl && !value) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, value]);

  useEffect(() => {
    if (uploadStatus.success && uploadedFileName) {
      onSuccessUpload(uploadedFileName);

      setUploadedFileName(null);
      dispatch(UploadResourceStatusActions.clearUploadStatus({ key: type }));
    }
  }, [uploadStatus.success, uploadedFileName, dispatch, type]);

  return (
    <div className="flex gap-4">
      <div
        className={classNames([
          'relative flex size-[60px] items-center justify-center overflow-hidden rounded-xl bg-layer-1 p-4',
          imageContainerClassName,
        ])}
      >
        <div
          className={classNames('absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-30', {
            hidden: !uploadStatus.inProgress,
          })}
        >
          <IconLoader className="text-white animate-spin" size={24} />
        </div>

        <img
          src={previewUrl || undefined}
          alt="Icon preview"
          className={classNames('object-contain transition-opacity', {
            'opacity-50 pointer-events-none': uploadStatus.inProgress,
          })}
          style={{ display: previewUrl ? 'block' : 'none' }}
        />
        {!previewUrl && !uploadStatus.inProgress && defaultIcon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-secondary">{label}</span>
        <label className="input-form peer mx-0 block w-[264px] px-3 text-sm hover:border-accent-primary focus:border-accent-primary">
          <div className={classNames(['flex justify-between gap-2', !name && 'text-secondary'])}>
            <div className="overflow-hidden text-ellipsis text-nowrap">{name || placeholder}</div>
            <div className="flex items-center gap-2">
              {!uploadStatus.inProgress && (
                <span className="cursor-pointer text-accent-primary">{name ? 'Change' : 'Add'}</span>
              )}
              {name && !uploadStatus.inProgress && (
                <div
                  onClick={event => {
                    event.preventDefault();
                    handleDeleteFile();
                  }}
                >
                  <IconX className="cursor-pointer text-secondary hover:text-accent-primary" size={18} />
                </div>
              )}
            </div>
          </div>
          <input type="file" className="hidden" onChange={handleSelectFile} accept={AllowedIconsTypes.join(',')} />
        </label>
      </div>
    </div>
  );
};
