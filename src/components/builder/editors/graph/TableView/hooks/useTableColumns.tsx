import { CellContext, Column, ColumnFiltersState, createColumnHelper } from '@tanstack/react-table';
import { Dispatch, SetStateAction, useMemo } from 'react';

import { NodeStatusDict } from '@/constants/app';
import { GraphElement, NodeStatus } from '@/types/graph';

import { Filter } from '../Filter/Filter';
import { SearchInput } from '../SearchInput/SearchInput';
import StatusCell from '../StatusCell/StatusCell';

const columnHelper = createColumnHelper<GraphElement>();

export const useTableColumns = (
  columnFilters: ColumnFiltersState,
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>,
  activeSearchColumn: string | null,
  setActiveSearchColumn: Dispatch<SetStateAction<string | null>>,
) => {
  return useMemo(() => {
    return [
      columnHelper.accessor('label', {
        header: ({ column }: { column: Column<GraphElement, string | undefined> }) => (
          <div className="relative flex items-center justify-between">
            {activeSearchColumn !== 'label' && <span>Title</span>}
            <SearchInput<GraphElement, string | undefined>
              column={column}
              isOpen={activeSearchColumn === 'label'}
              setIsOpen={(open: boolean) => {
                setActiveSearchColumn(open ? 'label' : null);
              }}
            />
          </div>
        ),
        cell: info => info.getValue(),
        filterFn: (row, columnId, filterValue: string) =>
          String(row.getValue(columnId)).toLowerCase().includes(filterValue.toLowerCase()),
      }),
      columnHelper.accessor('status', {
        id: 'status',
        cell: (info: CellContext<GraphElement, NodeStatus | undefined>) => (
          <StatusCell status={info.getValue() ?? NodeStatus.Draft} />
        ),
        header: ({ column }) => (
          <div className="flex items-center justify-between">
            <span className="grow">Status</span>
            <Filter<GraphElement, NodeStatus | undefined>
              column={column}
              options={Object.values(NodeStatus).map(status => ({
                id: status,
                label: NodeStatusDict[status],
              }))}
              selectedFilters={(columnFilters.find(f => f.id === 'status')?.value ?? []) as NodeStatus[]}
              onChange={filters => {
                setColumnFilters(prevFilters => [
                  ...prevFilters.filter(f => f.id !== 'status'),
                  { id: 'status', value: filters },
                ]);
              }}
              isOpen={activeSearchColumn === 'status'}
              setIsOpen={(open: boolean) => {
                setActiveSearchColumn(open ? 'status' : null);
              }}
            />
          </div>
        ),
        meta: { filterVariant: 'select' },
        filterFn: (row, columnId, filterValue: NodeStatus[]) => filterValue.includes(row.getValue(columnId)),
      }),
      columnHelper.accessor('questions', {
        header: ({ column }: { column: Column<GraphElement, string[] | undefined> }) => (
          <div className="relative flex items-center justify-between">
            {activeSearchColumn !== 'questions' && <span>Question</span>}
            <SearchInput<GraphElement, string[] | undefined>
              column={column}
              isOpen={activeSearchColumn === 'questions'}
              setIsOpen={(open: boolean) => {
                setActiveSearchColumn(open ? 'questions' : null);
              }}
            />
          </div>
        ),
        cell: info => {
          const value = info.getValue();
          return value?.at(0) ?? '';
        },
        filterFn: (row, columnId, filterValue: string) => {
          const value = row.getValue(columnId);
          if (Array.isArray(value)) {
            return value.at(0).toLowerCase().includes(filterValue.toLowerCase());
          }
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        },
      }),
      columnHelper.accessor('details', {
        header: ({ column }: { column: Column<GraphElement, string | undefined> }) => (
          <div className="relative flex items-center justify-between">
            {activeSearchColumn !== 'details' && <span>Details</span>}
            <SearchInput<GraphElement, string | undefined>
              column={column}
              isOpen={activeSearchColumn === 'details'}
              setIsOpen={(open: boolean) => {
                setActiveSearchColumn(open ? 'details' : null);
              }}
            />
          </div>
        ),
        filterFn: (row, columnId, filterValue: string) =>
          String(row.getValue(columnId)).toLowerCase().includes(filterValue.toLowerCase()),
      }),
    ];
  }, [columnFilters, activeSearchColumn, setActiveSearchColumn, setColumnFilters]);
};
