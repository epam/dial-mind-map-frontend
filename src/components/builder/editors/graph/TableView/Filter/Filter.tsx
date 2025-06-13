import { IconFilter } from '@tabler/icons-react';
import { Column } from '@tanstack/react-table';

import Checkbox from '@/components/builder/common/Checkbox';
import Tooltip from '@/components/builder/common/Tooltip';

interface Props<TData, TValue> {
  column: Column<TData, TValue>;
  options: { id: TValue; label: string }[];
  onChange: (filters: TValue[]) => void;
  selectedFilters?: TValue[] | undefined;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export const Filter = <TData, TValue>({
  column,
  options,
  onChange,
  selectedFilters,
  isOpen,
  setIsOpen,
}: Props<TData, TValue>) => {
  const toggleFilter = (filter: TValue) => {
    const updatedFilters = selectedFilters?.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...(selectedFilters ?? []), filter];
    column.setFilterValue(updatedFilters.length > 0 ? updatedFilters : undefined);
    onChange(updatedFilters);
  };

  const toggleSelectAll = () => {
    const newFilters = selectedFilters?.length === options.length ? [] : options;
    column.setFilterValue(newFilters.length > 0 ? newFilters : undefined);
    onChange(newFilters.map(option => option.id));
  };

  return (
    <Tooltip
      showArrow={false}
      contentClassName="px-1"
      placement="bottom-end"
      open={isOpen}
      onOpenChange={setIsOpen}
      tooltip={
        <div className="min-w-[150px] py-2 text-primary">
          <Checkbox
            checked={selectedFilters?.length === options.length}
            indeterminate={(selectedFilters?.length ?? 0) > 0 && (selectedFilters?.length ?? 0) < options.length}
            onChange={toggleSelectAll}
          >
            Select all
          </Checkbox>
          <div className="my-2 border-t  border-secondary" />
          {options.map(option => (
            <div key={String(option.id)} className="mt-1">
              <Checkbox checked={selectedFilters?.includes(option.id)} onChange={() => toggleFilter(option.id)}>
                {option.label}
              </Checkbox>
            </div>
          ))}
        </div>
      }
      isTriggerClickable
    >
      <button
        className="relative p-1 hover:text-accent-primary"
        onMouseDown={setIsOpen ? () => setIsOpen(!isOpen) : undefined}
      >
        <IconFilter size={16} />
        {selectedFilters && selectedFilters.length !== options.length && (
          <span
            data-testid="bubble-badge"
            className="absolute right-0.5 top-0 size-3 rounded-full border-2 border-secondary bg-accent-primary"
          />
        )}
      </button>
    </Tooltip>
  );
};
