import { IconCheck, IconLink } from '@tabler/icons-react';
import { IconFile, IconFileTypeHtml, IconFileTypePdf } from '@tabler/icons-react';
import classNames from 'classnames';
import { useCallback, useState } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import IconPptx from '@/icons/pptx.svg';
import { GenerationStatus, Source, SourceEditMode, SourceStatus, SourceType } from '@/types/sources';
import { isValidUrl } from '@/utils/app/common';

interface Props {
  field: Source;
  index: number;
  editMode: SourceEditMode;
  isEdited: boolean;
  isHovered: boolean;
  selectedRows: number[];
  hasError: boolean;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  handleRowSelection: (index: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  generationStatus: GenerationStatus | null;
  inProgressUrls: string[];
  globalSourceName?: string;
  onPasteList: (links: string[]) => void;
}

const getFileIcon = (type?: string) => {
  const classes = 'text-secondary min-w-[18px]';

  switch (type) {
    case 'application/pdf':
      return <IconFileTypePdf size={18} className={classes} />;
    case 'text/html':
      return <IconFileTypeHtml size={18} className={classes} />;
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return <IconPptx width={18} height={18} className={classes} />;
    default:
      return <IconFile size={18} className={classes} />;
  }
};

export const SourceInputField = ({
  field,
  index,
  editMode,
  isEdited,
  isHovered,
  selectedRows,
  hasError,
  value,
  onChange,
  onKeyDown,
  handleRowSelection,
  inputRef,
  generationStatus,
  inProgressUrls,
  globalSourceName,
  onPasteList,
}: Props) => {
  const [display, setDisplay] = useState(isEdited && editMode === 'edit' ? value : (globalSourceName ?? value));

  const isSelected = selectedRows.includes(index);
  const isRemoved = field.status === SourceStatus.REMOVED;

  const hasCheckbox =
    generationStatus !== GenerationStatus.NOT_STARTED &&
    (isHovered || isSelected) &&
    (!field.name || !inProgressUrls.includes(field.name)) &&
    field.status !== SourceStatus.INPROGRESS &&
    field.status !== SourceStatus.FAILED &&
    !isEdited;

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();

      const pastedText = event.clipboardData.getData('text');

      if (editMode === 'rename') {
        setDisplay(pastedText);
        onChange(pastedText);
        return;
      }

      const rows = Array.from(new Set(pastedText.split(/\r?\n/)));
      const extractedLinks = rows.filter(isValidUrl);

      if (extractedLinks.length > 1) {
        onPasteList(extractedLinks);
      } else {
        const linkValue = extractedLinks[0];
        setDisplay(linkValue);
        onChange(linkValue);
      }
    },
    [onPasteList, setDisplay, onChange, editMode],
  );

  return (
    <div
      className={classNames(
        'pl-6 w-full flex items-center outline-none',
        isEdited && '!bg-layer-2 w-full py-0 input-form stroke-accent-primary border-accent-primary rounded-none m-0',
        hasError && '!border-error hover:border-error focus:border-error',
      )}
    >
      {hasCheckbox ? (
        <>
          <input
            name="selection-checkbox"
            type="checkbox"
            className="checkbox peer mr-0 size-[18px] bg-layer-3 hover:cursor-pointer"
            onChange={() => handleRowSelection(index)}
            checked={isSelected}
          />
          <IconCheck
            size={18}
            className="pointer-events-none invisible absolute text-accent-primary peer-checked:visible"
          />
        </>
      ) : field.type === SourceType.FILE ? (
        getFileIcon(field.content_type)
      ) : (
        <IconLink className="min-w-[18px] text-secondary" size={18} />
      )}

      {!isEdited && globalSourceName ? (
        <div className="w-full overflow-x-hidden text-ellipsis text-nowrap">
          <Tooltip
            tooltip={value}
            triggerClassName={classNames(
              'bg-transparent pl-3 w-fit flex-1 outline-none text-ellipsis text-nowrap',
              isRemoved && 'text-secondary',
            )}
            contentClassName="text-sm px-2 text-primary"
          >
            {globalSourceName}
          </Tooltip>
        </div>
      ) : (
        <input
          value={display}
          onChange={e => {
            const newValue = e.target.value;
            setDisplay(newValue);
            onChange(newValue);
          }}
          onPaste={handlePaste}
          ref={inputRef}
          readOnly={!isEdited}
          onKeyDown={e => onKeyDown(e, index)}
          className={classNames(
            'bg-transparent pl-3 py-[9px] w-full outline-none text-ellipsis',
            isEdited && 'pr-16',
            isRemoved && 'text-secondary',
          )}
          placeholder="Source URL"
        />
      )}
    </div>
  );
};
