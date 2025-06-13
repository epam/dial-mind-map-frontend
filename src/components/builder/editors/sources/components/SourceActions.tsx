import { IconFile, IconLink } from '@tabler/icons-react';
import classNames from 'classnames';

import { AllowedSourceFilesTypes } from '@/constants/app';
import { CreateSource } from '@/types/sources';

interface Props {
  isValid: boolean;
  editableIndex: number | null;
  handleAddSource: ({ file, link }: CreateSource) => Promise<void>;
  handleSelectFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  bottomBorder?: boolean;
}

export const SourceActions = ({ isValid, editableIndex, handleAddSource, handleSelectFiles, bottomBorder }: Props) => {
  return (
    <div
      className={classNames(
        'flex gap-3 bg-layer-3 px-6  sticky py-[9px]',
        bottomBorder && 'border-b border-tertiary border-b-0',
      )}
    >
      <button
        type="button"
        onClick={() => handleAddSource({ link: '' })}
        disabled={!isValid || editableIndex !== null}
        className={classNames(
          'text-sm text-accent-primary flex gap-2 items-center',
          (!isValid || editableIndex !== null) && 'text-controls-disable',
        )}
      >
        <IconLink size={18} />
        Add link
      </button>

      <label
        className={classNames(
          'text-sm text-accent-primary flex gap-2 items-center pl-3 border-l border-primary hover:cursor-pointer',
          (!isValid || editableIndex !== null) && 'text-controls-disable pointer-events-none',
        )}
      >
        <input
          name="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleSelectFiles}
          disabled={!isValid}
          accept={AllowedSourceFilesTypes.join(',')}
          aria-label="upload file"
        />
        <IconFile size={18} />
        Upload file
      </label>
    </div>
  );
};
