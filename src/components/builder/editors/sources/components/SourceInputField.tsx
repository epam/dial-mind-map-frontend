import { IconCheck, IconLink } from '@tabler/icons-react';
import { IconFile, IconFileTypeHtml, IconFileTypePdf } from '@tabler/icons-react';
import classNames from 'classnames';
import { useState } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import IconPptx from '@/icons/pptx.svg';
import { GenerationStatus, Source, SourceEditMode, SourceStatus, SourceType } from '@/types/sources';

interface Props {
  field: Source;
  index: number;
  editableIndex: number | null;
  editMode: SourceEditMode;
  hoveredIndex: number | null;
  selectedRows: number[];
  hasError: boolean;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  handleRowSelection: (index: number) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  generationStatus: GenerationStatus | null;
  inProgressUrls: string[];
  globalSourceName?: string;
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

export const SourceInputField: React.FC<Props> = ({
  field,
  index,
  editableIndex,
  editMode,
  hoveredIndex,
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
}) => {
  const [display, setDisplay] = useState(
    editableIndex === index && editMode === 'edit' ? value : (globalSourceName ?? value),
  );

  const isHovered = hoveredIndex === index;
  const isSelected = selectedRows.includes(index);
  const isRemoved = field.status === SourceStatus.REMOVED;

  const hasCheckbox =
    generationStatus !== GenerationStatus.NOT_STARTED &&
    (isHovered || isSelected) &&
    (!field.name || !inProgressUrls.includes(field.name)) &&
    field.status !== SourceStatus.INPROGRESS &&
    (editableIndex ?? -1) < 0;

  return (
    <div
      className={classNames(
        'pl-6 w-full flex items-center outline-none',
        editableIndex === index &&
          '!bg-layer-2 w-full py-0 input-form stroke-accent-primary border-accent-primary rounded-none m-0',
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

      {editableIndex !== index && globalSourceName ? (
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
          ref={inputRef}
          readOnly={editableIndex !== index}
          onKeyDown={e => onKeyDown(e, index)}
          className={classNames(
            'bg-transparent pl-3 py-[9px] w-full outline-none text-ellipsis',
            editableIndex === index && 'pr-16',
            isRemoved && 'text-secondary',
          )}
          placeholder="Source URL"
        />
      )}
    </div>
  );
};
