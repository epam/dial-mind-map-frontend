import {
  IconDots,
  IconDownload,
  IconFlagCheck,
  IconForms,
  IconHistory,
  IconPlus,
  IconRefresh,
  IconSitemap,
  IconSortAscending,
  IconSortDescending,
  IconTrashX,
} from '@tabler/icons-react';
import { createColumnHelper } from '@tanstack/react-table';
import classNames from 'classnames';
import { useCallback, useMemo } from 'react';
import { Control, FieldArrayWithId, FieldErrors } from 'react-hook-form';

import ContextMenu from '@/components/builder/common/ContextMenu';
import Tooltip from '@/components/builder/common/Tooltip';
import { LoadingText } from '@/components/common/LoadingText';
import { useBuilderDispatch } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { DisplayMenuItemProps } from '@/types/menu';
import { GenerationStatus, Source, SourceEditMode, SourceStatus, SourceType } from '@/types/sources';

import { LastUpdateCell } from '../components/LastUpdateCell';
import { SourceInput } from '../components/SourceInput';
import { FormValues } from '../data';

interface Props {
  fields: FieldArrayWithId<FormValues, 'sources', '_id'>[];
  editableIndex: number | null;
  editMode: SourceEditMode;
  isValid: boolean;
  errors: FieldErrors<FormValues>;
  inProgressUrls: string[];
  control: Control<FormValues, any>;
  hoveredRow: number | null;
  selectedRows: number[];
  handleEdit: (index: number, editMode?: SourceEditMode) => void;
  handleDelete: (index: number) => void;
  handleDownload: (index: number) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  handleConfirmEdit: (index: number) => void;
  handleConfirmAdd: (index: number) => void;
  handleRowSelection: (index: number) => void;
  handleCancel: () => void;
  handleRefreshLink: (index: number) => void;
  isAddingModeRef: React.MutableRefObject<boolean>;
  generationStatus: GenerationStatus | null;
  onPasteList: (links: string[]) => void;
  onMarkAsApplied: (id?: string) => void;
  isLiteMode: boolean;
}

export const useSourceColumns = ({
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
  handleDownload,
  handleKeyDown,
  handleConfirmEdit,
  handleConfirmAdd,
  handleRowSelection,
  handleCancel,
  handleRefreshLink,
  isAddingModeRef,
  generationStatus,
  onPasteList,
  onMarkAsApplied,
  isLiteMode,
}: Props) => {
  const columnHelper = createColumnHelper<Source>();
  const dispatch = useBuilderDispatch();

  const getActionButtons = useCallback(
    (index: number, original: Source) => {
      if ((editableIndex ?? -1) >= 0) {
        return [];
      }

      if (original.status === SourceStatus.FAILED) {
        const elements: DisplayMenuItemProps[] = [];

        elements.push({
          dataQa: 'reindex',
          name: 'Reindex',
          Icon: IconRefresh,
          className: 'text-sm',
          iconClassName: '!text-error',
          onClick: () =>
            original.type === SourceType.LINK
              ? handleRefreshLink(index)
              : dispatch(UIActions.setSourceIdToAddVersion(original.id)),
        });

        elements.push({
          dataQa: 'delete',
          name: 'Delete version',
          Icon: IconTrashX,
          className: 'text-sm',
          onClick: () => handleDelete(index),
        });

        return elements;
      }

      if (generationStatus === GenerationStatus.NOT_STARTED) {
        const elements: DisplayMenuItemProps[] = [];

        elements.push({
          dataQa: 'delete',
          name: 'Delete source',
          Icon: IconTrashX,
          className: 'text-sm',
          onClick: () => handleDelete(index),
        });

        elements.push({
          dataQa: 'rename',
          name: 'Rename',
          Icon: IconForms,
          className: 'text-sm',
          onClick: () => handleEdit(index, 'rename'),
        });

        if (original.id && original.version) {
          elements.push({
            dataQa: 'download',
            name: 'Download',
            Icon: IconDownload,
            className: 'text-sm',
            onClick: () => handleDownload(index),
          });
        }

        return elements;
      }

      if (original.status === SourceStatus.REMOVED) {
        return [
          {
            dataQa: 'mark-as-applied',
            name: 'Mark as applied',
            Icon: IconFlagCheck,
            className: 'text-sm',
            onClick: () => onMarkAsApplied(original.id),
          },
        ];
      }

      const elements: DisplayMenuItemProps[] = [];

      if (original.type === SourceType.LINK) {
        elements.push(
          {
            dataQa: 'reindex',
            name: 'Reindex',
            Icon: IconRefresh,
            className: 'text-sm',
            onClick: () => handleRefreshLink(index),
          },
          {
            dataQa: 'delete',
            name: 'Delete source',
            Icon: IconTrashX,
            className: 'text-sm',
            onClick: () => handleDelete(index),
          },
          {
            dataQa: 'add-version',
            name: 'Add new version',
            Icon: IconPlus,
            className: 'text-sm',
            onClick: () => dispatch(UIActions.setSourceIdToAddVersion(original.id)),
          },
        );
      }

      if (original.type === SourceType.FILE) {
        elements.push(
          {
            dataQa: 'add-version',
            name: 'Add new version',
            Icon: IconPlus,
            className: 'text-sm',
            onClick: () => dispatch(UIActions.setSourceIdToAddVersion(original.id)),
          },
          {
            dataQa: 'delete',
            name: 'Delete source',
            Icon: IconTrashX,
            className: 'text-sm',
            onClick: () => handleDelete(index),
          },
        );
      }

      elements.push({
        dataQa: 'rename',
        name: 'Rename',
        Icon: IconForms,
        className: 'text-sm',
        onClick: () => handleEdit(index, 'rename'),
      });

      if (!original.in_graph && !isLiteMode) {
        elements.push({
          dataQa: 'add-to-graph',
          name: 'Add to graph',
          Icon: IconSitemap,
          className: 'text-sm',
          onClick: () => dispatch(UIActions.setSourceIdToApplyToGraph(original.id)),
        });

        elements.push({
          dataQa: 'mark-as-applied',
          name: 'Mark as applied',
          Icon: IconFlagCheck,
          className: 'text-sm',
          onClick: () => onMarkAsApplied(original.id),
        });
      }

      if (original.id && original.version) {
        elements.push({
          dataQa: 'download',
          name: 'Download',
          Icon: IconDownload,
          className: 'text-sm',
          onClick: () => handleDownload(index),
        });
      }

      elements.push({
        dataQa: 'versions-history',
        name: 'Versions history',
        Icon: IconHistory,
        className: 'text-sm',
        onClick: () => dispatch(UIActions.setSourceIdInVersionsModal(original.id)),
      });
      return elements;
    },
    [
      dispatch,
      editableIndex,
      generationStatus,
      handleDelete,
      handleDownload,
      handleEdit,
      handleRefreshLink,
      isLiteMode,
      onMarkAsApplied,
    ],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('url', {
        id: 'source',
        header: 'Sources',
        cell: info => {
          const index = info.row.index;
          const field = fields[index];

          return (
            <SourceInput
              key={field.id}
              index={index}
              field={field}
              editMode={editMode}
              isEdited={editableIndex === info.row.index}
              isHovered={hoveredRow === info.row.index}
              selectedRows={selectedRows}
              isValid={isValid}
              errors={errors}
              handleKeyDown={handleKeyDown}
              handleConfirmEdit={handleConfirmEdit}
              handleConfirmAdd={handleConfirmAdd}
              handleRowSelection={handleRowSelection}
              handleCancel={handleCancel}
              control={control}
              isAddingModeRef={isAddingModeRef}
              inProgressUrls={inProgressUrls}
              generationStatus={generationStatus}
              onPasteList={onPasteList}
            />
          );
        },
      }),
      columnHelper.accessor('version', {
        id: 'version',
        header: header => (
          <div className="flex cursor-pointer items-center gap-1" onClick={() => header.column.toggleSorting()}>
            <span>Version</span>
            {header.column.getIsSorted() === 'asc' && <IconSortAscending size={14} />}
            {header.column.getIsSorted() === 'desc' && <IconSortDescending size={14} />}
          </div>
        ),
        cell: info => {
          const {
            row: { original },
          } = info;

          return (
            <div className="px-4 py-2">
              {original.status !== SourceStatus.REMOVED ? (
                info.getValue() || '-'
              ) : (
                <span className="italic text-secondary">deleted</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('tokens', {
        id: 'tokens',
        header: header => (
          <div className="flex cursor-pointer items-center gap-1" onClick={() => header.column.toggleSorting()}>
            <span>Tokens</span>
            {header.column.getIsSorted() === 'asc' && <IconSortAscending size={14} />}
            {header.column.getIsSorted() === 'desc' && <IconSortDescending size={14} />}
          </div>
        ),
        cell: info => {
          if (info.row.original.status === SourceStatus.REMOVED) return null;
          if (info.row.original.status === SourceStatus.INPROGRESS) {
            return (
              <div className="px-4 py-2">
                <LoadingText text="Indexing" />
              </div>
            );
          }
          return <div className="px-4 py-2">{info.getValue() || '-'}</div>;
        },
      }),
      columnHelper.accessor('created', {
        id: 'created',
        header: header => (
          <div className="flex cursor-pointer items-center gap-1" onClick={() => header.column.toggleSorting()}>
            <span>Last update</span>
            {header.column.getIsSorted() === 'asc' && <IconSortAscending size={14} />}
            {header.column.getIsSorted() === 'desc' && <IconSortDescending size={14} />}
          </div>
        ),
        cell: info => {
          if (info.row.original.status === SourceStatus.REMOVED) return null;
          if (info.row.original.status === SourceStatus.INPROGRESS && !info.getValue()) {
            return (
              <div className="px-4 py-2">
                <LoadingText text="Loading" />
              </div>
            );
          }
          if (!info.getValue()) return '-';
          return <LastUpdateCell date={info.getValue()} />;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',

        cell: info => {
          const {
            row: { index, original },
          } = info;
          const isHovered = hoveredRow === index;
          const isEditing = editableIndex === index;

          if (
            isEditing ||
            (original.name && inProgressUrls.includes(original.name)) ||
            original.status === SourceStatus.INPROGRESS
          )
            return null;

          const menuItems = getActionButtons(index, original);
          const limit = menuItems.length > 3 ? 2 : 3;
          const visibleItems = menuItems.slice(0, limit);
          const hiddenItems = menuItems.slice(limit);

          return isHovered ? (
            <div className="mr-4 flex items-center justify-end gap-2 p-2">
              {visibleItems.map(({ name, dataQa, iconClassName, Icon, onClick }) => (
                <Tooltip key={dataQa} tooltip={name} contentClassName="text-sm px-2 text-primary">
                  <button data-testid={dataQa} type="button" onClick={onClick}>
                    {Icon && (
                      <Icon
                        size={18}
                        height={18}
                        width={18}
                        className={classNames('text-secondary hover:text-accent-primary', iconClassName)}
                      />
                    )}{' '}
                  </button>
                </Tooltip>
              ))}
              {!!hiddenItems.length && (
                <ContextMenu
                  TriggerIcon={IconDots}
                  triggerIconClassName="flex cursor-pointer items-center"
                  triggerIconHighlight
                  triggerIconSize={18}
                  menuItems={hiddenItems}
                  menuOffset={6}
                />
              )}
            </div>
          ) : null;
        },
      }),
    ],
    [
      columnHelper,
      fields,
      editableIndex,
      editMode,
      hoveredRow,
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
      getActionButtons,
      onPasteList,
    ],
  );

  return { columns };
};
