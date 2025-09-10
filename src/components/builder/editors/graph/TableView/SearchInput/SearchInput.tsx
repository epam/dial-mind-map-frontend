import { IconSearch } from '@tabler/icons-react';
import { Column } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';

interface Props<TData, TValue> {
  column: Column<TData, TValue>;
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
}

export const SearchInput = <TData, TValue>({ column, setIsOpen, isOpen }: Props<TData, TValue>) => {
  const currentValue = (column.getFilterValue() as string) || '';
  const [inputValue, setInputValue] = useState(currentValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    column.setFilterValue(e.target.value || undefined);
  };

  const handleIconClick = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleBlur = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center">
      <button onMouseUp={handleIconClick} className="relative p-1 hover:text-accent-primary">
        <IconSearch size={16} />
        {!!currentValue.length && (
          <span
            data-testid="bubble-badge"
            className="absolute right-0.5 top-0 size-3 rounded-full border-2 border-secondary bg-accent-primary"
          />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'ml-2 w-full opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          autoFocus={isOpen}
          onBlur={handleBlur}
          placeholder="Search..."
          className="w-full max-w-[200px] border-b border-secondary bg-transparent text-[14px] leading-3 text-primary outline-none placeholder:text-secondary"
        />
      </div>
    </div>
  );
};
