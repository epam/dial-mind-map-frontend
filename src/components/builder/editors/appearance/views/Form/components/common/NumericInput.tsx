import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import classNames from 'classnames';
import { ChangeEvent, ElementType, useEffect, useState } from 'react';

interface Props {
  id: string;
  label?: string;
  icon?: ElementType;
  onChange: (val: number | undefined) => void;
  max?: number;
  min?: number;
  value?: number;
  step?: number;
  placeholder?: string;
  wrapperClassNames?: string;
  defaultValue?: number;
}

export const NumericInput = ({
  id,
  label,
  icon: Icon,
  onChange,
  max = 1000,
  min = 0,
  value: externalValue,
  step = 1,
  placeholder,
  wrapperClassNames,
  defaultValue,
}: Props) => {
  const [value, setValue] = useState(externalValue?.toString() ?? '');

  useEffect(() => {
    const stringified = externalValue?.toString() ?? '';
    if (stringified !== value) {
      setValue(stringified);
    }
  }, [externalValue, value]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    let input = e.target.value;

    if (input === '') {
      setValue('');
      onChange(undefined);
      return;
    }

    if (!/^-?\d*\.?\d*$/.test(input)) return;

    if (/^(-?)0+\d/.test(input)) {
      input = input.replace(/^(-?)0+/, '$1');
    }

    const numericValue = parseFloat(input);

    if (!isNaN(numericValue)) {
      if (numericValue > max || numericValue < min) return;
    }

    setValue(input);
    onChange(!isNaN(numericValue) ? numericValue : undefined);
  }

  function updateValue(increment: boolean) {
    const current = parseFloat(value);
    const initialValue = defaultValue ?? 0;
    let newValue = (isNaN(current) ? initialValue : current) + (increment ? step : -step);

    if (newValue > max) newValue = max;
    if (newValue < min) newValue = min;

    const newString = newValue.toString();
    setValue(newString);
    onChange(newValue);
  }

  return (
    <div className={classNames(['flex flex-col', wrapperClassNames])}>
      {label && (
        <label htmlFor={id} className="w-fit text-xs text-secondary">
          {label}
        </label>
      )}
      <div className="group relative w-[160px]">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={classNames([
            'input-form peer mx-0 w-full pr-[36px] text-sm focus:border-accent-primary group-hover:border-accent-primary',
            Icon && 'pl-[38px]',
          ])}
        />
        {Icon && <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />}
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 flex-col">
          <button type="button" onClick={() => updateValue(true)} className="hover:text-accent-primary">
            <IconChevronUp size={16} />
          </button>
          <button type="button" onClick={() => updateValue(false)} className="hover:text-accent-primary">
            <IconChevronDown size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
