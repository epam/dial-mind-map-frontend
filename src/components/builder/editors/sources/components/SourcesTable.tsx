import { IconCheck, IconMinus } from '@tabler/icons-react';
import { flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import classNames from 'classnames';
import { ChangeEvent, useCallback, useState } from 'react';
import { Control, FieldArrayWithId, FieldErrors, useWatch } from 'react-hook-form';

import DropOverlay from '@/components/builder/common/DropOverlay';
import { AllowedSourceFilesTypes } from '@/constants/app';
import { CreateSource, GenerationStatus, SourceEditMode } from '@/types/sources';

import { FormValues } from '../data';
import { useSourceColumns } from '../hooks/useSourceColumns';
import { useSourceFileDrop } from '../hooks/useSourceFileDrop';
import { EmptyTableState } from './EmptyTableState';
import { SourceActions } from './SourceActions';
import { SourceInput } from './SourceInput';

interface Props {
  editableIndex: number | null;
  editMode: SourceEditMode;
  fields: FieldArrayWithId<FormValues, 'sources', '_id'>[];
  isValid: boolean;
  errors: FieldErrors<FormValues>;
  selectedRows: number[];
  handleRowSelection: (index: number) => void;
  handleSelectionReset: () => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  handleConfirmEdit: (index: number) => void;
  handleConfirmAdd: (index: number) => void;
  handleCancel: () => void;
  handleEdit: (index: number, editMode?: SourceEditMode) => void;
  handleDelete: (index: number) => void;
  handleDownload: (index: number) => void;
  control: Control<FormValues, any>;
  inProgressUrls: string[];
  isAddingModeRef: React.MutableRefObject<boolean>;
  generationStatus: GenerationStatus | null;
  handleAddSource: ({ file, link }: CreateSource) => Promise<void>;
  handleSelectFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  handleRefreshLink: (index: number) => void;
  isSimpleGenerationModeAvailable?: boolean;
  onPasteList: (links: string[]) => void;
  onMarkAsApplied: (id?: string) => void;
  isLiteMode: boolean;
}

export const SourcesTable: React.FC<Props> = ({
  editableIndex,
  editMode,
  fields,
  isValid,
  errors,
  selectedRows,
  handleRowSelection,
  handleSelectionReset,
  handleCancel,
  handleConfirmAdd,
  handleEdit,
  handleConfirmEdit,
  handleKeyDown,
  handleDelete,
  handleDownload,
  control,
  inProgressUrls,
  isAddingModeRef,
  generationStatus,
  handleAddSource,
  handleSelectFiles,
  handleRefreshLink,
  onPasteList,
  onMarkAsApplied,
  isLiteMode,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const watchedSources = useWatch({
    control,
    name: 'sources',
  });

  const { columns } = useSourceColumns({
    fields,
    editableIndex,
    editMode,
    isValid,
    errors,
    inProgressUrls,
    control,
    hoveredRow,
    selectedRows,
    handleEdit,
    handleDelete,
    handleKeyDown,
    handleConfirmEdit,
    handleConfirmAdd,
    handleRowSelection,
    handleCancel,
    handleDownload,
    isAddingModeRef,
    generationStatus,
    handleRefreshLink,
    onPasteList,
    onMarkAsApplied,
    isLiteMode,
  });

  const table = useReactTable({
    data: fields,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getRowId: row => row.id ?? row.url,
  });

  const flatHeaders = table.getFlatHeaders();
  const rows = table.getRowModel().rows;

  const handleFilesDrop = useCallback(
    (files: File[]) => {
      Array.from(files).forEach(file => {
        handleAddSource({ file });
      });
    },
    [handleAddSource],
  );

  const { isDragging } = useSourceFileDrop({ handleAddSources: handleFilesDrop, watchedSources: watchedSources });

  const renderHeaderCheckbox = useCallback(() => {
    const allSelected = selectedRows.length === fields.length;
    const someSelected = selectedRows.length > 0 && !allSelected;

    const onChange = () => {
      if (selectedRows.length === 0) {
        // select all
        fields.forEach((_, idx) => handleRowSelection(idx));
      } else {
        handleSelectionReset();
      }
    };

    return (
      <div className="flex">
        <input
          type="checkbox"
          className="checkbox peer mr-0 size-[18px] bg-layer-3 hover:cursor-pointer"
          onChange={onChange}
          checked={allSelected}
        />
        {allSelected ? (
          <IconCheck size={18} className="pointer-events-none absolute text-accent-primary" />
        ) : (
          someSelected && <IconMinus size={18} className="pointer-events-none absolute text-accent-primary" />
        )}
      </div>
    );
  }, [selectedRows, fields, handleRowSelection, handleSelectionReset]);

  return (
    <div className="flex size-full flex-col overflow-x-auto">
      <table className="w-full min-w-[600px] table-fixed">
        {rows.length !== 0 && (
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-tertiary bg-layer-3">
              {flatHeaders.map(header => (
                <th
                  key={header.id}
                  className={classNames(
                    'text-left pb-1 px-4 h-8 text-secondary uppercase text-[11px] leading-[150%] font-bold',
                    header.id === 'source' && selectedRows.length && 'w-auto pl-6',
                    header.id === 'source' &&
                      !selectedRows.length &&
                      (!isHeaderHovered || generationStatus === GenerationStatus.NOT_STARTED) &&
                      'w-auto pl-[53px]',
                    header.id === 'source' && isHeaderHovered && !selectedRows.length && 'pl-6',
                    header.id === 'version' && 'w-[85px]',
                    header.id === 'tokens' && 'w-[80px]',
                    header.id === 'created' && 'w-[190px]',
                    header.id === 'actions' && 'w-[90px]',
                  )}
                  onMouseEnter={() => header.id === 'source' && setIsHeaderHovered(true)}
                  onMouseLeave={() => header.id === 'source' && setIsHeaderHovered(false)}
                >
                  {header.id === 'source' && (selectedRows.length > 0 || isHeaderHovered) ? (
                    <div className="flex items-center gap-[11px]">
                      {generationStatus !== GenerationStatus.NOT_STARTED && renderHeaderCheckbox()}
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </th>
              ))}
            </tr>
          </thead>
        )}

        <tbody>
          {rows.length === 0 ? (
            <EmptyTableState
              editableIndex={editableIndex}
              isValid={isValid}
              columnsCount={flatHeaders.length}
              handleAddSource={handleAddSource}
              handleSelectFiles={handleSelectFiles}
            />
          ) : (
            rows.map(row => {
              const isEditing = row.index === editableIndex;
              const rowId = fields[row.index]?.id || row.id;
              const source = fields[row.index];

              return isEditing ? (
                <tr key={row.id} className="border-b border-tertiary">
                  <td colSpan={flatHeaders.length}>
                    <SourceInput
                      key={rowId}
                      index={row.index}
                      field={source}
                      editMode={editMode}
                      isEdited={isEditing}
                      isHovered={hoveredRow === row.index}
                      selectedRows={selectedRows}
                      isValid={isValid}
                      errors={errors}
                      generationStatus={generationStatus}
                      handleKeyDown={handleKeyDown}
                      handleConfirmEdit={handleConfirmEdit}
                      handleConfirmAdd={handleConfirmAdd}
                      handleRowSelection={handleRowSelection}
                      handleCancel={handleCancel}
                      control={control}
                      isAddingModeRef={isAddingModeRef}
                      inProgressUrls={inProgressUrls}
                      onPasteList={onPasteList}
                    />
                  </td>
                </tr>
              ) : (
                <tr
                  key={row.id}
                  className="border-b border-tertiary hover:bg-layer-2"
                  onMouseEnter={() => setHoveredRow(row.index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className={classNames(
                        cell.column.id === 'source' ? 'p-0' : '',
                        cell.column.id === 'tokens' ? 'align-middle' : '',
                        cell.column.id === 'created' ? 'align-middle' : '',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {rows.length > 0 && (
        <SourceActions
          isValid={isValid}
          editableIndex={editableIndex}
          handleAddSource={handleAddSource}
          handleSelectFiles={handleSelectFiles}
        />
      )}

      <DropOverlay visible={isDragging} supportedFormats={Object.keys(AllowedSourceFilesTypes)} />
    </div>
  );
};
