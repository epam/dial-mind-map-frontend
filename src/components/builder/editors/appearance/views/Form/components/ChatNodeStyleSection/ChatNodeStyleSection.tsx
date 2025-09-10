import { IconBorderRadius } from '@tabler/icons-react';
import classNames from 'classnames';
import { debounce } from 'lodash-es';
import { useCallback, useMemo } from 'react';

import { Space } from '@/components/common/Space/Space';
import { INPUT_DEBOUNCE } from '@/constants/app';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ChatNodeType, ThemeConfig } from '@/types/customization';

import { NumericInput } from '../common/NumericInput';
import { ToggleGroup, ToggleOption } from '../common/ToggleGroup';
import { ChatNodeMaskSubSection } from './ChatNodeMaskSubSection';

export const ChatNodeStyleSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const themeConfig = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const chatNodeConfig = themeConfig?.chat?.chatNode;
  const useNodeIconAsBgImage = themeConfig?.graph?.useNodeIconAsBgImage;

  const onChangeNodeType = (finalValue: ChatNodeType) => {
    if (!themeConfig) return;

    const updatedConfig = {
      ...themeConfig,
      chat: {
        ...themeConfig.chat,
        chatNode: {
          ...chatNodeConfig,
          availableNodeType: finalValue,
        },
      },
    };

    dispatch(
      AppearanceActions.updateThemeConfig({
        config: updatedConfig,
        theme,
      }),
    );
  };

  const handleChangeWidth = useCallback(
    (finalValue?: number) => {
      if (!themeConfig) return;

      const updatedConfig: ThemeConfig = {
        ...themeConfig,
        chat: {
          ...themeConfig.chat,
          chatNode: {
            ...chatNodeConfig,
            'corner-radius': finalValue,
          },
        },
      };

      dispatch(
        AppearanceActions.updateThemeConfig({
          config: updatedConfig,
          theme,
        }),
      );
    },
    [dispatch, theme, themeConfig, chatNodeConfig],
  );

  const debouncedChange = useMemo(() => debounce(handleChangeWidth, INPUT_DEBOUNCE), [handleChangeWidth]);

  const types = useMemo(
    () =>
      [
        {
          label: 'Filled',
          value: ChatNodeType.Filled,
          className: 'bg-layer-4',
          buttonActiveClassName: 'border-accent-primary !bg-accent-primary text-controls-permanent',
        },
        {
          label: 'Outlined',
          value: ChatNodeType.Outlined,
          buttonActiveClassName: 'border-accent-primary',
        },
        {
          label: 'Imaged',
          value: ChatNodeType.Imaged,
          className: classNames(['bg-layer-4', !useNodeIconAsBgImage && 'opacity-50 pointer-events-none']),
          buttonActiveClassName: 'border-accent-primary !bg-accent-primary text-controls-permanent',
          disabled: !useNodeIconAsBgImage,
          tooltipText: 'Available only when a background image is configured',
        },
      ] as ToggleOption<ChatNodeType>[],
    [useNodeIconAsBgImage],
  );

  return (
    <Space direction="vertical" size="large" align="start">
      <Space direction="vertical" size="small" align="start">
        <span className="text-xs text-secondary">Node style</span>
        <ToggleGroup
          options={types}
          value={chatNodeConfig?.availableNodeType ?? ChatNodeType.Filled}
          onChange={onChangeNodeType}
          buttonClassName="min-w-[60px] text-center"
        />
      </Space>
      {chatNodeConfig?.availableNodeType === ChatNodeType.Imaged ? (
        <ChatNodeMaskSubSection />
      ) : (
        <NumericInput
          id={'corner-radius'}
          label={'Corner radius'}
          icon={IconBorderRadius}
          onChange={debouncedChange}
          max={50}
          value={chatNodeConfig?.['corner-radius']}
          placeholder="Auto"
        />
      )}
    </Space>
  );
};
