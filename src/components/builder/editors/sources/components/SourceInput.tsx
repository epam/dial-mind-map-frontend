import { IconCheck, IconPointFilled, IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';

import Loader from '@/components/builder/common/Loader';
import Tooltip from '@/components/builder/common/Tooltip';
import { BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';
import { GenerationStatus, Source, SourceEditMode, SourceStatus, SourceType } from '@/types/sources';
import { isValidUrl } from '@/utils/app/common';

import { FormValues } from '../data';
import { SourceInputField } from './SourceInputField';

interface SourceInputProps {
  index: number;
  field: Source;
  editableIndex: number | null;
  editMode: SourceEditMode;
  hoveredIndex: number | null;
  selectedRows: number[];
  isValid: boolean;
  errors: FieldErrors<FormValues>;
  generationStatus: GenerationStatus | null;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  handleConfirmEdit: (index: number) => void;
  handleConfirmAdd: (index: number) => void;
  handleRowSelection: (index: number) => void;
  handleCancel: () => void;
  control: Control<FormValues, any>;
  isAddingModeRef: React.MutableRefObject<boolean>;
  inProgressUrls: string[];
}

export const SourceInput: React.FC<SourceInputProps> = ({
  index,
  field,
  editableIndex,
  editMode,
  hoveredIndex,
  selectedRows,
  isValid,
  errors,
  handleKeyDown,
  handleConfirmEdit,
  handleConfirmAdd,
  handleRowSelection,
  handleCancel,
  control,
  isAddingModeRef,
  inProgressUrls,
  generationStatus,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const sourcesNames = useBuilderSelector(BuilderSelectors.selectSourcesNames);

  useEffect(() => {
    if (editableIndex === index && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editableIndex, index, field.type]);

  const renderSourceStatus = (field: Source) => {
    if (editableIndex === index) return null;

    if (!field.status || field.status === SourceStatus.INPROGRESS || inProgressUrls.includes(field.url)) {
      return <Loader size={16} containerClassName="absolute left-1 !w-fit" loaderClassName="!text-primary" />;
    }

    if (field.status === SourceStatus.FAILED) {
      return (
        <Tooltip
          tooltip={field.status_description}
          triggerClassName="absolute left-0.5"
          contentClassName="text-xs px-2 text-primary"
        >
          <IconPointFilled size={20} className="text-error" />
        </Tooltip>
      );
    }

    if (
      generationStatus !== GenerationStatus.NOT_STARTED &&
      (!field.in_graph || field.status === SourceStatus.REMOVED)
    ) {
      return (
        <Tooltip
          tooltip="Hasn't been applied to the graph. The knowledge base has been updated."
          triggerClassName="absolute left-0.5"
          contentClassName="text-xs px-2 text-primary"
        >
          <IconPointFilled size={20} className="text-warning" />
        </Tooltip>
      );
    }

    return null;
  };

  return (
    <div className="group relative flex flex-col">
      <div className="flex items-center gap-2">
        {renderSourceStatus(field)}

        <Controller
          name={`sources.${index}.url`}
          control={control}
          rules={{
            validate: value => {
              if (editableIndex !== index) return true;

              if (editMode === 'rename') {
                return value ? true : 'Invalid name';
              }

              if (field.type === SourceType.FILE) return true;
              const duplicate = control._formValues.sources.some(
                (s: Source, i: number) => i !== index && s.url === value,
              );
              if (duplicate) return 'This link is already added';
              return isValidUrl(value) || 'Invalid URL';
            },
          }}
          render={({ field: fieldValue }) => (
            <SourceInputField
              field={field}
              index={index}
              editableIndex={editableIndex}
              editMode={editMode}
              hoveredIndex={hoveredIndex}
              selectedRows={selectedRows}
              hasError={!!errors.sources?.[index]?.url}
              value={
                (field.type === SourceType.FILE
                  ? (field.name ?? fieldValue.value?.split('/').pop())
                  : fieldValue.value) ?? ''
              }
              onChange={fieldValue.onChange}
              onKeyDown={handleKeyDown}
              handleRowSelection={handleRowSelection}
              inputRef={inputRef}
              generationStatus={generationStatus}
              inProgressUrls={inProgressUrls}
              globalSourceName={field.id ? sourcesNames[field.id] : undefined}
            />
          )}
        />

        <div
          className={classNames(
            'absolute right-2 flex items-center gap-2',
            editableIndex !== index && 'opacity-0 group-hover:opacity-100 transition-opacity',
          )}
        >
          {editableIndex === index ? (
            <>
              {isValid && (
                <Tooltip tooltip="Confirm" contentClassName="text-sm px-2 text-primary">
                  <button
                    type="button"
                    onClick={() => (isAddingModeRef.current ? handleConfirmAdd(index) : handleConfirmEdit(index))}
                  >
                    <IconCheck className="text-secondary" size={18} />
                  </button>
                </Tooltip>
              )}
              <Tooltip tooltip="Cancel" contentClassName="text-sm px-2 text-primary">
                <button type="button" onClick={handleCancel}>
                  <IconX className="text-secondary" size={18} />
                </button>
              </Tooltip>
            </>
          ) : null}
        </div>
      </div>
      {errors.sources?.[index]?.url && (
        <p className="bg-layer-2 pl-[25px] text-xxs text-error">{errors.sources[index]!.url!.message}</p>
      )}
    </div>
  );
};
