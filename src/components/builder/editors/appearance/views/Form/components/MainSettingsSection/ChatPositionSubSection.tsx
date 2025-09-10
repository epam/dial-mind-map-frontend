import classNames from 'classnames';
import { useMemo } from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import { ChatSide, sidesConfigs } from '../../data/constants';
import { ChatPreview } from './ChatPreview';

export const ChatPositionSubSection = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const side = config?.chat?.chatSide ?? ChatSide.RIGHT;

  const handleChange = (value: ChatSide) => {
    if (!config) return;

    const updatedConfig: ThemeConfig = {
      ...config,
      chat: {
        ...config.chat,
        chatSide: value,
      },
    };

    dispatch(
      AppearanceActions.updateThemeConfig({
        theme,
        config: updatedConfig,
      }),
    );
  };

  const previewProps = useMemo(
    () => ({
      bgColor: config?.colors?.['bg-layer-1'] ?? '#EEF2F7',
      borderColor: config?.colors?.['stroke-primary'] ?? '#E5E7EB',
      nodeColor: config?.graph?.paletteSettings?.focusedNodeColors?.bgColor ?? '#9CA3AF',
      pillColors: config?.graph?.paletteSettings?.branchesColors.map(c => c.bgColor) ?? [],
      lineColors: config?.graph?.paletteSettings?.branchesColors.map(c => c.edgeColor || c.bgColor) ?? [],
      inputColor: config?.colors?.['bg-layer-3'] ?? '#FFFFFF',
      width: 340,
      height: 190,
      textColor: config?.colors?.['text-primary'],
    }),
    [config],
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-secondary">Chat position</span>
      <div className="flex gap-5">
        {sidesConfigs.map(({ id, label, value }) => (
          <div
            key={id}
            className={classNames([
              'border rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-accent-primary',
              side === value ? 'border-accent-primary' : 'border-primary',
            ])}
            onClick={() => handleChange(value)}
          >
            <div className="flex items-center gap-2">
              <div className="grid place-items-center">
                <input
                  type="radio"
                  id={id}
                  role="radio"
                  value={value}
                  checked={side === value}
                  readOnly
                  name={label}
                  className="peer col-start-1 row-start-1 size-[18px] shrink-0 appearance-none rounded-full border border-primary checked:border-accent-primary"
                />
                <div className="col-start-1 row-start-1 size-[10px] rounded-full peer-checked:bg-accent-primary" />
              </div>
              <label htmlFor={id}>{label}</label>
            </div>
            <ChatPreview panelPosition={value} className="aspect-[340/190] w-full" {...previewProps} />
          </div>
        ))}
      </div>
    </div>
  );
};
