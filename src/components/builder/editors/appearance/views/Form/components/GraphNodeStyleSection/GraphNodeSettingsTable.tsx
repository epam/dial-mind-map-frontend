import { IconLetterCase, IconRulerMeasure, IconRulerMeasure2, IconSpacingVertical } from '@tabler/icons-react';
import classNames from 'classnames';

import Tooltip from '@/components/builder/common/Tooltip';
import { GraphNodeState, GraphNodeType, NodeStylesKey } from '@/types/customization';

import { GraphNodeTypesToColumnNames, NodeStylesKeysToRowNames } from '../../data/constants';
import { NumericInput } from '../common/NumericInput';

export type GraphNodeSettingsTableData = Record<NodeStylesKey, { base?: number; [GraphNodeState.Hovered]?: number }>;

export const GraphNodeSettingsTable = ({
  showRowLabels = false,
  type,
  data,
  onChange,
  disabled,
  disabledTooltipText,
}: {
  onChange: (type: GraphNodeType, field: string, value?: number, state?: GraphNodeState) => void;
  showRowLabels?: boolean;
  type: GraphNodeType;
  data: GraphNodeSettingsTableData;
  disabled?: boolean;
  disabledTooltipText?: string;
}) => {
  return (
    <div className="inline-block text-sm">
      <div className="flex flex-col">
        <div className="flex">
          {showRowLabels && <div className="w-[116px]" />}
          <div className="flex flex-1 items-center gap-2 rounded-t bg-layer-1 p-2 px-3">
            <span className="text-sm font-semibold text-primary">{GraphNodeTypesToColumnNames[type]}</span>
          </div>
        </div>
        <div className="flex">
          {showRowLabels && <div className="w-[116px]" />}
          <div className="flex w-[328px] items-center gap-2 rounded-b bg-layer-2 p-2 px-3 text-sm italic text-primary">
            <span className="flex-1">Default</span>
            <span className="flex-1">Hover</span>
          </div>
        </div>
      </div>

      <div>
        {Object.keys(data).map(key => (
          <div key={`${type}-${key}`} className="flex items-center gap-2 pt-2">
            {showRowLabels && (
              <div className="mr-4 w-[92px] whitespace-nowrap text-sm text-primary">
                {NodeStylesKeysToRowNames[key as NodeStylesKey]}
              </div>
            )}
            <div className="flex-1">
              <Tooltip
                tooltip={disabledTooltipText}
                hideTooltip={!disabled}
                delayOpen={250}
                contentClassName="text-xs px-2 py-1 text-primary"
              >
                <NumericInput
                  id={`${type}-${key}-base`}
                  icon={getIcon(key as NodeStylesKey)}
                  onChange={value => onChange(type, key, value)}
                  value={data[key as NodeStylesKey].base}
                  wrapperClassNames={classNames([disabled && 'opacity-50 pointer-events-none touch-none'])}
                  min={key === NodeStylesKey.TextMarginY ? -1000 : 0}
                />
              </Tooltip>
            </div>
            <div className="flex-1">
              <Tooltip
                tooltip={disabledTooltipText}
                hideTooltip={!disabled}
                delayOpen={250}
                contentClassName="text-xs px-2 py-1 text-primary"
              >
                <NumericInput
                  id={`${type}-${key}-hovered`}
                  icon={getIcon(key as NodeStylesKey)}
                  onChange={value => onChange(type, key, value, GraphNodeState.Hovered)}
                  value={data[key as NodeStylesKey][GraphNodeState.Hovered]}
                  wrapperClassNames={classNames([disabled && 'opacity-50 pointer-events-none touch-none'])}
                  min={key === NodeStylesKey.TextMarginY ? -1000 : 0}
                />
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getIcon = (field: NodeStylesKey) => {
  switch (field) {
    case NodeStylesKey.Width:
      return IconRulerMeasure;
    case NodeStylesKey.Height:
      return IconRulerMeasure2;
    case NodeStylesKey.FontSize:
      return IconLetterCase;
    case NodeStylesKey.TextMarginY:
      return IconSpacingVertical;
    default:
      return undefined;
  }
};
