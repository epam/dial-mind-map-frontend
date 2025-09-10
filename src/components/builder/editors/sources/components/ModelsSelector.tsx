/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Select, { components, OptionProps, SingleValueProps } from 'react-select';

import { Model } from '@/types/model';

interface ModelSelectorProps {
  models: Model[];
  selectedModel: Model | null;
  onChange: (model: Model | null) => void;
  placeholder?: string;
  disabled?: boolean;
  fallbackIcon?: string;
  isLoading?: boolean;
}

const isUrl = (value?: string): boolean => {
  if (!value) return false;
  return /^(https?:\/\/|\/)/.test(value);
};

const ModelIcon: React.FC<{ iconUrl?: string; displayName?: string; fallbackIcon?: string }> = ({
  iconUrl,
  displayName,
  fallbackIcon = 'api/themes/image/default-model.svg',
}) => {
  const [src, setSrc] = useState(iconUrl && isUrl(iconUrl) ? iconUrl : `/api/themes/image/${iconUrl ?? ''}`);
  const handleError = () => setSrc(fallbackIcon);

  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-secondary bg-model-icon">
      <img src={src} alt={displayName} className="size-4" onError={handleError} />
    </span>
  );
};

const ModelOption = (props: OptionProps<Model>) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        <ModelIcon iconUrl={data.icon_url} displayName={data.display_name} />
        <div className="flex flex-col">
          <span className="text-sm">{data.display_name}</span>
          {data.display_version && <span className="text-xs text-secondary">{data.display_version}</span>}
        </div>
      </div>
    </components.Option>
  );
};

const ModelSingleValue = (props: SingleValueProps<Model>) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        <ModelIcon iconUrl={data.icon_url} displayName={data.display_name} />
        <div className="flex flex-col">
          <span className="text-sm">{data.display_name}</span>
          {data.display_version && <span className="text-xs text-secondary">{data.display_version}</span>}
        </div>
      </div>
    </components.SingleValue>
  );
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onChange,
  placeholder = 'Select model...',
  disabled = false,
  isLoading = false,
}) => {
  const options = models.map(model => ({ ...model, value: model.id, label: model.display_name }));

  return (
    <Select
      value={selectedModel}
      onChange={option => onChange(option as Model)}
      options={options}
      isDisabled={disabled || isLoading}
      placeholder={placeholder}
      isSearchable
      isLoading={isLoading}
      styles={{
        container: styles => ({
          ...styles,
          width: '100%',
          minWidth: '180px',
        }),
        input: styles => ({
          ...styles,
          color: 'var(--text-primary)',
        }),
        control: (styles, { isFocused }) => ({
          ...styles,
          display: 'flex',
          backgroundColor: 'var(--bg-layer-2)',
          borderColor: isFocused ? 'var(--stroke-accent-primary)' : 'var(--stroke-primary)',
          borderRadius: 3,
          padding: '2px 4px',
          boxShadow: 'none',
          cursor: 'pointer',
          ':hover': {
            borderColor: 'var(--stroke-accent-primary)',
          },
        }),
        placeholder: styles => ({
          ...styles,
          color: 'var(--text-secondary)',
        }),
        singleValue: styles => ({
          ...styles,
          color: 'var(--text-primary)',
        }),
        menu: styles => ({
          ...styles,
          backgroundColor: 'var(--bg-layer-3)',
          border: '1px solid var(--stroke-primary)',
          borderRadius: 3,
          margin: 0,
        }),
        menuList: styles => ({
          ...styles,
          padding: 0,
        }),
        option: (styles, { isSelected, isFocused }) => ({
          ...styles,
          color: 'var(--text-primary)',
          backgroundColor: isSelected || isFocused ? 'var(--bg-layer-2)' : 'transparent',
          cursor: 'pointer',
          ':hover': {
            backgroundColor: 'var(--bg-layer-2)',
          },
        }),
        valueContainer: styles => ({
          ...styles,
          gap: '4px',
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
      components={{
        Option: ModelOption,
        SingleValue: ModelSingleValue,
      }}
    />
  );
};
