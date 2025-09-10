import debounce from 'lodash-es/debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

const INPUT_DEBOUNCE = 500;

export const InputPlaceholderSubSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const placeholder = config?.chat?.placeholder ?? '';

  const [value, setValue] = useState(placeholder);

  useEffect(() => {
    setValue(placeholder);
  }, [placeholder]);

  const handleChange = useCallback(
    (value: string) => {
      if (!config) return;

      const updatedConfig: ThemeConfig = {
        ...config,
        chat: {
          ...config.chat,
          placeholder: value,
        },
      };

      dispatch(
        AppearanceActions.updateThemeConfig({
          theme,
          config: updatedConfig,
        }),
      );
    },
    [config, dispatch, theme],
  );

  const debouncedChange = useMemo(() => debounce(handleChange, INPUT_DEBOUNCE), [handleChange]);

  useEffect(() => {
    return () => {
      debouncedChange.cancel();
    };
  }, [debouncedChange]);

  return (
    <div className="flex flex-col">
      <label htmlFor="chat-placeholder" className="text-xs text-secondary">
        Input placeholder
      </label>
      <input
        id="chat-placeholder"
        value={value}
        onChange={e => {
          setValue(e.target.value);
          debouncedChange(e.target.value);
        }}
        className="input-form peer mx-0 w-fit min-w-[340px] text-sm hover:border-accent-primary focus:border-accent-primary"
      />
    </div>
  );
};
