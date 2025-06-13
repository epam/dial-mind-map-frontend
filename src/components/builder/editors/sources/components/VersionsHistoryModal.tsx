import { IconCheck, IconDots, IconDownload, IconPlus, IconPointFilled, IconRefresh, IconX } from '@tabler/icons-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import classNames from 'classnames';
import { ChangeEvent, FC, useCallback, useMemo, useRef, useState } from 'react';

import ContextMenu from '@/components/builder/common/ContextMenu';
import Loader from '@/components/builder/common/Loader';
import Modal from '@/components/builder/common/Modal';
import Tooltip from '@/components/builder/common/Tooltip';
import { AllowedSourceFilesTypes, BytesInMb } from '@/constants/app';
import { MAX_SOURCE_FILE_SIZE_MB } from '@/constants/settings';
import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { DisplayMenuItemProps } from '@/types/menu';
import { ModalState } from '@/types/modal';
import { CreateSource, Source, SourceStatus, SourceType } from '@/types/sources';
import { isValidUrl } from '@/utils/app/common';

import { sanitizeAndReportFiles } from '../utils/files';
import { LastUpdateCell } from './LastUpdateCell';

interface VersionsHistoryModalProps {
  isOpen: boolean;
  handleClose: () => void;
  handleAddVersion: (source: CreateSource) => void;
}

export const VersionsHistoryModal: FC<VersionsHistoryModalProps> = ({ isOpen, handleClose, handleAddVersion }) => {
  const columnHelper = createColumnHelper<Source>();

  const dispatch = useBuilderDispatch();

  const sourceIdInVersionsModal = useBuilderSelector(UISelectors.selectSourceIdInVersionsModal);
  const globalSources = useBuilderSelector(BuilderSelectors.selectSources);

  const [addingMode, setAddingMode] = useState<'none' | 'new'>('none');
  const [inProgressName, setInProgressName] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const numberOfVersionsBeforeAdd = useRef(0);

  const sorting = useMemo(() => [{ id: 'version', desc: false }], []);

  const filteredSources = useMemo(() => {
    const filtered = globalSources.filter(s => s.id === sourceIdInVersionsModal);
    if (numberOfVersionsBeforeAdd.current < filtered.length && inProgressName) {
      setInProgressName(undefined);
    }
    numberOfVersionsBeforeAdd.current = filtered.length;
    return filtered;
  }, [globalSources, sourceIdInVersionsModal, inProgressName]);

  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const getActionButtons = (index: number, original: Source) => {
    const elements: DisplayMenuItemProps[] = [];

    if (original.status === SourceStatus.FAILED) {
      return [
        {
          dataQa: 'reindex',
          name: 'Reindex',
          Icon: IconRefresh,
          className: 'text-sm',
          iconClassName: '!text-error',
          onClick: () => {
            if (original.type === SourceType.LINK) {
              handleAddVersion({ link: original.url, sourceId: original.id, versionId: original.version });
            } else {
              dispatch(UIActions.setSourceIdToAddVersion(original.id));
            }
          },
        },
      ];
    }

    if (original.id && original.version) {
      elements.push({
        dataQa: 'download',
        name: 'Download',
        Icon: IconDownload,
        className: 'text-sm',
        onClick: () =>
          dispatch(
            BuilderActions.downloadSource({
              sourceId: original.id!,
              versionId: original.version!,
              name: original.name ?? original.url,
            }),
          ),
      });
    }

    return elements;
  };

  const renderSourceStatus = (field: Source) => {
    if (!field.status || field.status === SourceStatus.INPROGRESS) {
      return <Loader size={16} containerClassName="absolute left-[-20px] !w-fit" loaderClassName="!text-primary" />;
    }

    if (field.status === SourceStatus.FAILED) {
      return (
        <Tooltip
          tooltip={field.status_description}
          triggerClassName="absolute left-[-20px]"
          contentClassName="text-xs px-2 text-primary"
        >
          <IconPointFilled size={20} className="text-error" />
        </Tooltip>
      );
    }

    if (!field.in_graph || field.status === SourceStatus.REMOVED) {
      return (
        <Tooltip
          tooltip="Hasn't been applied to the graph. The knowledge base has been updated."
          triggerClassName="absolute left-[-20px]"
          contentClassName="text-xs px-2 text-primary"
        >
          <IconPointFilled size={20} className="text-warning" />
        </Tooltip>
      );
    }

    return null;
  };

  const table = useReactTable({
    data: filteredSources,
    columns: [
      columnHelper.accessor('url', {
        id: 'source',
        header: 'Sources',
        cell: info => {
          const {
            row: { original },
          } = info;

          const value = original.type === SourceType.FILE ? original.name : original.url;

          return (
            <div className="relative flex gap-3">
              <div className="flex items-center gap-2">
                {renderSourceStatus(original)}
                <Tooltip
                  tooltip={original.active ? 'Active version' : 'Mark as active'}
                  contentClassName="text-sm px-2 text-primary"
                  isTriggerClickable={!!inProgressName}
                >
                  <input
                    disabled={!!inProgressName}
                    name="version"
                    type="checkbox"
                    checked={original.active && original.status !== SourceStatus.INPROGRESS}
                    onChange={() => {
                      if (!original.active) {
                        dispatch(
                          BuilderActions.setActiveSourceVersion({
                            sourceId: original.id!,
                            versionId: original.version!,
                          }),
                        );
                      }
                    }}
                    className={classNames(
                      'checkbox peer mr-0 size-[16px] rounded-[10px] border-[1.5px] bg-layer-3 hover:cursor-pointer hover:border-success checked:border-success',
                      !!inProgressName && 'pointer-events-none',
                    )}
                  />
                  <IconCheck
                    size={12}
                    stroke={3.5}
                    className="pointer-events-none invisible absolute left-[2px] text-success peer-checked:visible"
                  />
                </Tooltip>
              </div>
              <div className="overflow-x-hidden text-ellipsis">{value}</div>
            </div>
          );
        },
      }),
      columnHelper.accessor('version', {
        id: 'version',
        header: 'version',
        cell: info => <div className="px-4 py-2">{info.getValue() || '-'}</div>,
      }),
      columnHelper.accessor('tokens', {
        id: 'tokens',
        header: 'Tokens',
        cell: info => <div className="px-4 py-2">{info.getValue() || '-'}</div>,
      }),
      columnHelper.accessor('created', {
        id: 'created',
        header: 'Created',
        cell: info => <LastUpdateCell date={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: info => {
          const {
            row: { index, original },
          } = info;

          const isHovered = hoveredRow === index;

          const menuItems = getActionButtons(index, original);
          const limit = menuItems.length > 3 ? 2 : 3;
          const visibleItems = menuItems.slice(0, limit);
          const hiddenItems = menuItems.slice(limit);

          return isHovered ? (
            <div className="mr-4 flex items-center justify-end gap-2 p-2">
              {visibleItems.map(({ name, dataQa, Icon, onClick, iconClassName }) => (
                <Tooltip key={dataQa} tooltip={name} contentClassName="text-sm px-2 text-primary">
                  <button data-testid={dataQa} type="button" onClick={onClick}>
                    {Icon && (
                      <Icon size={18} height={18} width={18} className={classNames('text-secondary', iconClassName)} />
                    )}{' '}
                  </button>
                </Tooltip>
              ))}
              {!!hiddenItems.length && (
                <ContextMenu
                  TriggerIcon={IconDots}
                  className="z-50"
                  triggerIconClassName="flex cursor-pointer items-center"
                  triggerIconHighlight
                  triggerIconSize={18}
                  menuItems={hiddenItems}
                />
              )}
            </div>
          ) : null;
        },
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const rows = table.getRowModel().rows;

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>, sourceId: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      const link = inputRef.current?.value;

      if (link) {
        setInProgressName(link);
        setAddingMode('none');
        handleAddVersion({ link, sourceId });
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setAddingMode('none');
    }
  }, []);

  const handleSelectFiles = useCallback(
    (e: ChangeEvent<HTMLInputElement>, sourceId?: string) => {
      const chosen = Array.from(e.target.files || []);
      const filtered = sanitizeAndReportFiles(
        chosen,
        dispatch,
        AllowedSourceFilesTypes,
        MAX_SOURCE_FILE_SIZE_MB * BytesInMb,
      );

      if (filtered.length > 0) {
        const file = filtered[0];
        setInProgressName(file.name);
        setAddingMode('none');
        handleAddVersion({ file, sourceId });
      }

      e.target.value = '';
    },
    [dispatch],
  );

  const [isUrlValid, setIsUrlValid] = useState<boolean>(true);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUrlValid(!inputRef.current?.value || isValidUrl(e.target.value ?? ''));
  }, []);

  const activeSourceUrl = useMemo(() => filteredSources.find(s => s.active)?.url ?? '', [filteredSources]);

  return (
    <Modal
      portalId="theme-main"
      containerClassName="inline-block w-full max-w-[1000px] h-[380px] px-6 py-4 md:p-6 z-40"
      state={isOpen ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      heading="Versions history"
      headingClassName="text-primary"
      dismissProps={{ outsidePress: true }}
    >
      <div className="-mx-6 flex flex-col md:-mx-6">
        <div className="flex h-[324px] flex-col overflow-y-scroll border-t border-tertiary">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-tertiary bg-layer-3">
                {table.getFlatHeaders().map(header => (
                  <th
                    key={header.id}
                    className={classNames(
                      'text-left py-2 px-4 text-xs h-9 text-secondary font-medium text-text-secondary uppercase',
                      header.id === 'source' && 'w-auto pl-6',
                      header.id === 'version' && 'w-[85px]',
                      header.id === 'tokens' && 'w-[80px]',
                      header.id === 'created' && 'w-[190px]',
                      header.id === 'actions' && 'w-[35px]',
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-tertiary text-primary hover:bg-layer-2"
                  onMouseEnter={() => setHoveredRow(row.index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className={classNames(
                        'text-sm',
                        cell.column.id === 'source' ? 'pl-6' : '',
                        cell.column.id === 'tokens' ? 'align-middle' : '',
                        cell.column.id === 'created' ? 'align-middle' : '',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {inProgressName && (
            <div
              className={classNames(
                'flex bg-layer-3 sticky border-b border-tertiary pl-[52px] py-[9px] text-sm text-primary',
              )}
            >
              <Loader size={16} containerClassName="absolute left-[24px] !w-fit" loaderClassName="!text-primary" />
              {inProgressName}
            </div>
          )}
          {addingMode !== 'none' ? (
            <div className="group relative flex flex-col">
              <div
                className={classNames([
                  'pl-[39px] flex items-center justify-between outline-none !bg-layer-2 text-sm w-full py-0 input-form stroke-accent-primary border-accent-primary rounded-none m-0',
                  !isUrlValid && '!border-error hover:border-error focus:border-error',
                ])}
              >
                <input
                  ref={inputRef}
                  autoFocus
                  onKeyDown={e => handleKeyDown(e, sourceIdInVersionsModal!)}
                  defaultValue={addingMode === 'new' ? activeSourceUrl : ''}
                  onChange={handleInputChange}
                  className={classNames(
                    'bg-transparent pl-3 py-[9px] w-full outline-none text-ellipsis pr-16 placeholder:text-sm text-primary',
                  )}
                  placeholder="Source URL"
                />
                <div className={classNames('absolute right-2 flex items-center gap-2')}>
                  {(inputRef.current?.value || (addingMode === 'new' && inputRef.current?.value !== '')) &&
                    isUrlValid && (
                      <Tooltip tooltip="Confirm" contentClassName="text-sm px-2 text-primary">
                        <button
                          type="button"
                          onClick={() => {
                            const link = inputRef.current?.value;

                            if (link) {
                              setInProgressName(link);
                              setAddingMode('none');
                              handleAddVersion({ link, sourceId: sourceIdInVersionsModal });
                            }
                          }}
                        >
                          <IconCheck className="text-secondary" size={18} />
                        </button>
                      </Tooltip>
                    )}
                  <Tooltip tooltip="Cancel" contentClassName="text-sm px-2 text-primary">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingMode('none');
                      }}
                    >
                      <IconX className="text-secondary" size={18} />
                    </button>
                  </Tooltip>
                </div>
              </div>
              {!isUrlValid && <p className="bg-layer-2 pl-[52px] text-xxs text-error">Invalid URL</p>}
            </div>
          ) : (
            !inProgressName && (
              <div
                className={classNames('flex bg-layer-3 sticky bottom-0 border-b border-tertiary pl-[23px] py-[9px]')}
              >
                {filteredSources.some(s => s.type === SourceType.LINK) ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingMode('new');
                      }}
                      className={classNames('text-sm text-accent-primary flex gap-2 items-center')}
                    >
                      <IconPlus size={18} />
                      Add new version
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInProgressName(activeSourceUrl);
                        handleAddVersion({ link: activeSourceUrl, sourceId: sourceIdInVersionsModal });
                      }}
                      className={classNames(
                        'text-sm text-accent-primary flex gap-2 items-center pl-3 border-l border-primary',
                      )}
                    >
                      <IconRefresh size={18} />
                      Reindex
                    </button>
                  </div>
                ) : (
                  <label
                    className={classNames('text-sm text-accent-primary flex gap-2 items-center hover:cursor-pointer')}
                  >
                    <input
                      type="file"
                      className="hidden"
                      onChange={event => handleSelectFiles(event, sourceIdInVersionsModal)}
                      accept={AllowedSourceFilesTypes.join(',')}
                      aria-label="upload file"
                    />
                    <IconPlus size={18} />
                    Add new version
                  </label>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </Modal>
  );
};
