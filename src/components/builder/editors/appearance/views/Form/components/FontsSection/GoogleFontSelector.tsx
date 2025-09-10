import { useEffect, useRef, useState } from 'react';
import Select from 'react-select';

import { DefaultFontFamily } from '@/constants/app';

interface FontOption {
  label: string;
  value: string;
}

interface Props {
  fontFamily?: string;
  onChange: (value?: string) => void;
  googleFontsApiKey: string;
  placeholder?: string;
}

export const GoogleFontSelector = ({ googleFontsApiKey, onChange, placeholder, fontFamily }: Props) => {
  const [googleFonts, setGoogleFonts] = useState<FontOption[]>([]);
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current || !googleFontsApiKey) return;
    didFetchRef.current = true;

    const fetchGoogleFonts = async () => {
      try {
        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${googleFontsApiKey}`);
        const data = await response.json();
        const fontFamilies = data.items.map((font: { family: string }) => ({
          label: font.family,
          value: font.family,
        }));
        setGoogleFonts(fontFamilies);
      } catch (error) {
        console.error('Error fetching Google Fonts:', error);
      }
    };

    fetchGoogleFonts();
  }, [googleFontsApiKey]);

  return (
    <div>
      <Select
        isSearchable
        isClearable={fontFamily !== DefaultFontFamily}
        closeMenuOnSelect
        value={
          fontFamily
            ? {
                label: fontFamily,
                value: fontFamily,
              }
            : undefined
        }
        placeholder={placeholder}
        options={googleFonts}
        onChange={val => onChange(val?.value)}
        styles={{
          container: styles => ({
            ...styles,
            width: 'fit-content',
            minWidth: '340px',
          }),
          input: styles => ({
            ...styles,
            height: '21px',
            padding: 0,
            margin: 0,
            color: 'var(--text-primary)',
          }),
          menu: styles => ({ ...styles, margin: 0 }),
          menuList: styles => ({
            ...styles,
            margin: 0,
            padding: 0,
            backgroundColor: 'var(--bg-layer-0)',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }),
          option: (styles, { isSelected }) => ({
            ...styles,
            color: 'var(--text-primary)',
            WebkitTapHighlightColor: 'var(--bg-layer-2)',
            backgroundColor: isSelected ? 'var(--bg-layer-2)' : '',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            cursor: 'pointer',
            ':hover': {
              backgroundColor: 'var(--bg-layer-2)',
            },
          }),
          valueContainer: styles => ({
            ...styles,
            padding: '4px',
            gap: '2px',
          }),
          singleValue: (styles, { selectProps }) => ({
            ...styles,
            margin: 0,
            color: selectProps.menuIsOpen ? 'var(--text-secondary)' : 'var(--text-primary)',
          }),
          placeholder: styles => ({
            ...styles,
            color: 'var(--text-secondary)',
            margin: 0,
          }),
          noOptionsMessage: styles => ({
            ...styles,
            textAlign: 'start',
          }),
          control: (styles, { isFocused }) => ({
            ...styles,
            paddingLeft: '8px',
            display: 'flex',
            cursor: 'text',
            backgroundColor: 'bg-transparent',
            boxShadow: 'none',
            transition: 'all 0',
            borderColor: isFocused ? 'var(--stroke-accent-primary)' : 'var(--stroke-primary)',
            borderRadius: 3,
            ':hover': {
              borderColor: 'var(--stroke-accent-primary)',
            },
          }),
          indicatorSeparator: styles => ({
            ...styles,
            backgroundColor: 'var(--stroke-primary)',
          }),
          indicatorsContainer: styles => ({
            ...styles,
            color: 'var(--stroke-primary)',
            ':hover': {
              cursor: 'pointer',
            },
          }),
        }}
      />
    </div>
  );
};
