import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import classNames from 'classnames';
import { memo, useEffect, useState } from 'react';

import { EmptyTable } from '@/components/common/EmptyTable';
import { GraphActions, GraphSelectors } from '@/store/builder/graph/graph.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { GraphElement, NodeStatus } from '@/types/graph';

import { useTableColumns } from './hooks/useTableColumns';

const TableView = () => {
  const dispatch = useBuilderDispatch();
  const elements = useBuilderSelector(GraphSelectors.selectElements);
  const focusNodeId = useBuilderSelector(GraphSelectors.selectFocusNodeId);
  const highlightedNodeIds = useBuilderSelector(GraphSelectors.selectHighlightedNodeIds);
  const rootNodeId = useBuilderSelector(GraphSelectors.selectRootNodeId);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: 'status', value: Object.values(NodeStatus) },
  ]);
  const [data, setData] = useState(elements.filter(e => !!e.position).map(e => e.data));

  const [activeSearchColumn, setActiveSearchColumn] = useState<string | null>(null);

  useEffect(() => {
    setData(elements.filter(e => !!e.position).map(e => e.data));
  }, [elements]);

  const columns = useTableColumns(columnFilters, setColumnFilters, activeSearchColumn, setActiveSearchColumn);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
  });

  const handleRowClick = (rowData: GraphElement) => {
    dispatch(GraphActions.setFocusNodeId(rowData.id));
    dispatch(UIActions.setIsNodeEditorOpen(true));
  };

  return (
    <div style={{ direction: table.options.columnResizeDirection }} className="size-full">
      <table
        style={{
          width: table.getCenterTotalSize(),
        }}
        className={classNames(['min-w-full table-fixed w-full', table.getRowModel().rows.length === 0 && 'h-full'])}
      >
        <thead className="sticky top-0 z-10 bg-layer-3">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                  className="relative border border-t-0 border-tertiary px-3 py-2 text-start text-[11px] uppercase text-secondary"
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  <div
                    onDoubleClick={() => header.column.resetSize()}
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={`absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-accent-primary ${
                      header.column.getIsResizing() ? 'bg-accent-primary' : ''
                    }`}
                    style={{
                      touchAction: 'none',
                      userSelect: 'none',
                    }}
                  />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        {table.getRowModel().rows.length > 0 ? (
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                id={row.original.id}
                key={row.id}
                className="cursor-pointer bg-layer-3 hover:bg-layer-2"
                onClick={() => handleRowClick(row.original)}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(),
                    }}
                    className={classNames([
                      'border border-tertiary px-3 py-2 overflow-hidden text-nowrap',
                      row.original.id === focusNodeId && 'bg-accent-primary-alpha',
                      row.original.id === rootNodeId && row.original.id !== focusNodeId && 'bg-layer-4',
                      highlightedNodeIds.length > 0 &&
                        !highlightedNodeIds.includes(row.original.id) &&
                        'opacity-50 bg-layer-2',
                    ])}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : (
          <tr>
            <td colSpan={4}>
              <EmptyTable />
            </td>
          </tr>
        )}
      </table>
    </div>
  );
};

export default memo(TableView);
