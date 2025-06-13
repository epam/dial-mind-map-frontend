import { IconCheck } from '@tabler/icons-react';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked = false, indeterminate = false, onChange, onBlur, children }) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = () => {
    onChange?.(!checked);
  };

  return (
    <label className="flex cursor-pointer items-center space-x-2">
      <input
        ref={checkboxRef}
        type="checkbox"
        className="hidden"
        checked={checked}
        onChange={handleChange}
        onBlur={onBlur}
      />
      <div
        className={classNames(
          'w-4 h-4 flex items-center justify-center border rounded-sm transition-all',
          checked || indeterminate ? 'border-accent-primary' : 'border-primary',
        )}
        role="checkbox"
        data-testid="custom-checkbox"
      >
        {indeterminate ? (
          <div data-testid="indeterminate-mark" className="h-0.5 w-2 bg-accent-primary"></div>
        ) : checked ? (
          <IconCheck data-testid="check-icon" className="text-accent-primary" size={18} />
        ) : null}
      </div>
      {children && <span className="text-sm text-primary">{children}</span>}
    </label>
  );
};

export default Checkbox;
