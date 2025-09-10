import debounce from 'lodash-es/debounce';
import { useMemo } from 'react';

const INPUT_DEBOUNCE = 500;

interface Props {
  fontFamily?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
}

export const GoogleFontInput = ({ fontFamily, onChange, placeholder }: Props) => {
  const debouncedChange = useMemo(() => debounce(onChange, INPUT_DEBOUNCE), [onChange]);

  return (
    <input
      id="font"
      defaultValue={fontFamily}
      placeholder={placeholder}
      onChange={e => debouncedChange(e.target.value)}
      className="input-form peer w-fit min-w-[340px] text-sm hover:border-accent-primary focus:border-accent-primary"
    />
  );
};
