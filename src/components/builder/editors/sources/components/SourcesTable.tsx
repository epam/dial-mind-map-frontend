import { IconMinus } from '@tabler/icons-react';
import { flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import classNames from 'classnames';
import { ChangeEvent, useState } from 'react';
import { Control, FieldArrayWithId, FieldErrors } from 'react-hook-form';

import { CreateSource, GenerationStatus, SourceEditMode } from '@/types/sources';

import { FormValues } from '../data';
import { useSourceColumns } from '../hooks/useSourceColumns';
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
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

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

  return (
    <div className="flex flex-col border-t border-tertiary">
      <table className="w-full table-fixed">
        {rows.length !== 0 && (
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-tertiary bg-layer-3">
              {table.getFlatHeaders().map(header => (
                <th
                  key={header.id}
                  className={classNames(
                    'text-left py-2 px-4 h-9 text-secondary font-medium uppercase text-[11px] leading-[14px] font-bold',
                    header.id === 'source' && selectedRows.length && 'w-auto pl-6',
                    header.id === 'source' && !selectedRows.length && 'w-auto pl-[53px]',
                    header.id === 'version' && 'w-[85px]',
                    header.id === 'tokens' && 'w-[80px]',
                    header.id === 'created' && 'w-[190px]',
                    header.id === 'actions' && 'w-[90px]',
                  )}
                >
                  {header.id === 'source' && selectedRows.length ? (
                    <div className="flex items-center gap-[11px]">
                      <div className="flex">
                        <input
                          type="checkbox"
                          className="checkbox peer mr-0 size-[18px] bg-layer-3 hover:cursor-pointer"
                          onChange={() => handleSelectionReset()}
                          checked={!!selectedRows.length}
                        />
                        <IconMinus
                          size={18}
                          className="pointer-events-none invisible absolute text-accent-primary peer-checked:visible"
                        />
                      </div>

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
                      editableIndex={editableIndex}
                      editMode={editMode}
                      hoveredIndex={hoveredRow}
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
                    />
                  </td>
                </tr>
              ) : (
                <tr
                  key={row.id}
                  className="border-b border-tertiary hover:bg-layer-2"
                  onMouseEnter={() => setHoveredRow(row.index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  // onDoubleClick={() =>
                  //   source.type !== SourceType.FILE && source.status === SourceStatus.FAILED && handleEdit(row.index)
                  // }
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
      {rows.length > 0 && !selectedRows.length && (
        <SourceActions
          isValid={isValid}
          editableIndex={editableIndex}
          handleAddSource={handleAddSource}
          handleSelectFiles={handleSelectFiles}
        />
      )}
    </div>
  );
};
