import type { JSX } from 'react';
import Select, { StylesConfig } from 'react-select';

export interface SelectOption {
  value: string;
  label: string;
  backgroundColor: string;
  borderColor: string;
  icon: JSX.Element;
}

interface Props {
  className?: string;
  value: SelectOption;
  options: SelectOption[];
  onChange: (option: SelectOption) => void;
}

export const StatusSelector = ({ onChange, options, value, className }: Props) => {
  return (
    <Select
      className={className}
      id="node-status"
      options={options}
      value={value}
      isSearchable={false}
      onChange={option => onChange(option!)}
      styles={customStyles(value)}
      formatOptionLabel={option => (
        <div className="flex items-center gap-2">
          {option.icon && option.icon}
          <span>{option.label}</span>
        </div>
      )}
    />
  );
};

const customStyles: (status: SelectOption) => StylesConfig<SelectOption, false> = status => ({
  container: styles => ({
    ...styles,
    width: '100%',
  }),
  input: styles => ({
    ...styles,
    color: 'var(--text-primary)',
  }),
  control: (styles, { isFocused }) => ({
    ...styles,
    borderColor: isFocused ? 'var(--stroke-accent-primary) !important' : 'transparent',
    backgroundColor: 'transparent',
    borderRadius: 3,
    boxShadow: 'none',
    color: 'var(--text-primary)',
    display: 'flex',
    padding: '0 2px',
    ':hover': {
      borderColor: 'var(--stroke-primary)',
    },
  }),
  valueContainer: styles => ({
    ...styles,
    paddingLeft: 0,
    paddingRight: 6,
  }),
  singleValue: styles => ({
    ...styles,
    color: 'var(--text-primary)',
    borderWidth: '1px',
    borderColor: status.borderColor || 'var(--stroke-primary)',
    backgroundColor: status.backgroundColor || 'var(--bg-layer-3)',
    borderRadius: 3,
    width: 'fit-content',
    padding: '5px 8px',
  }),
  option: (styles, { data, isFocused }) => ({
    ...styles,
    backgroundColor: data.backgroundColor,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    alignItems: 'center',
    border: `1px solid ${isFocused ? data.borderColor : 'transparent'}`,
    transition: 'border-color 0.2s',
    ':hover': {
      borderColor: data.borderColor,
    },
    ':active': {
      backgroundColor: data.backgroundColor,
    },
  }),
  menu: styles => ({
    ...styles,
    marginTop: 2,
  }),
  menuList: styles => ({
    ...styles,
    borderRadius: 3,
    margin: 0,
    padding: 0,
    backgroundColor: 'var(--bg-layer-0)',
  }),
  dropdownIndicator: styles => ({
    ...styles,
    display: 'none',
  }),
  indicatorSeparator: styles => ({
    ...styles,
    display: 'none',
  }),
});
