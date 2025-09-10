import { IconPlus, IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import React from 'react';

import { ColorPickerInput } from '@/components/common/ColorPickerInput';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import {
  FIELD_NAME_DIVIDER,
  MindmapColorDefaultFieldsList,
  MindmapColorFieldNamesList,
  MindmapColorFocusNodeFieldNamesList,
  MindmapColorFocusNodeFieldsList,
  MindmapColorMandatoryFieldsList,
  MindmapColorVisitedFieldNamesList,
  MindmapColorVisitedFieldsList,
} from '../data/constants';

export const MindMapColorsSection: React.FC = () => {
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const branches = config?.graph?.paletteSettings?.branchesColors || [];
  const focusedNodeColors = config?.graph?.paletteSettings?.focusedNodeColors || {};

  const handleFocusedNodeCommit = (name: string, finalColor: string) => {
    if (!config) return;
    const updatedConfig: ThemeConfig = {
      ...config,
      graph: {
        ...config.graph,
        paletteSettings: {
          ...config.graph.paletteSettings,
          focusedNodeColors: {
            ...config.graph.paletteSettings.focusedNodeColors,
            [name]: finalColor,
          },
        },
      },
    };

    dispatch(
      AppearanceActions.updateThemeConfig({
        theme,
        config: updatedConfig,
      }),
    );
  };

  const handleBranchCommit = (name: string, finalColor: string) => {
    if (!config) return;
    const [indexStr, field] = name.split(FIELD_NAME_DIVIDER);
    const index = Number(indexStr);

    const updatedBranches = branches.map((b, i) => (i === index ? { ...b, [field]: finalColor } : b));

    const updatedConfig: ThemeConfig = {
      ...config,
      graph: {
        ...config.graph,
        paletteSettings: {
          ...config.graph.paletteSettings,
          branchesColors: updatedBranches,
        },
      },
    };

    dispatch(
      AppearanceActions.updateThemeConfig({
        theme,
        config: updatedConfig,
      }),
    );
  };

  const handleRemoveBranch = (index: number) => {
    if (!config) return;
    const updatedBranches = branches.filter((_, i) => i !== index);
    const updatedConfig: ThemeConfig = {
      ...config,
      graph: {
        ...config.graph,
        paletteSettings: {
          ...config.graph?.paletteSettings,
          branchesColors: updatedBranches,
        },
      },
    };
    dispatch(
      AppearanceActions.updateThemeConfig({
        theme,
        config: updatedConfig,
      }),
    );
  };

  return (
    <div className="relative flex w-full flex-col space-y-3 overflow-x-auto pb-2">
      <div className="sticky left-0 mb-4 inline-flex min-w-[496px]">
        <div className="w-[496px]">
          <h4 className="rounded-t bg-layer-1 p-2 text-sm font-semibold text-primary">Focus node</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-b bg-layer-2">
              {MindmapColorFocusNodeFieldNamesList.map(fieldName => (
                <div key={`${fieldName}_focus_subHeader`} className="w-[160px] p-2 italic">
                  {fieldName}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {MindmapColorFocusNodeFieldsList.map(fieldName => (
                <ColorPickerInput
                  name={fieldName}
                  color={focusedNodeColors[fieldName] ?? ''}
                  onCommit={handleFocusedNodeCommit}
                  key={`focusNode${fieldName}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative inline-flex min-w-[1210px] gap-6">
        <div className="w-[664px]">
          <h4 className="rounded-t bg-layer-1 p-2 text-sm font-semibold text-primary">Default</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-b bg-layer-2">
              {MindmapColorFieldNamesList.map(fieldName => (
                <div key={`${fieldName}_subHeader`} className="w-[160px] p-2 italic">
                  {fieldName}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-[496px]">
          <h4 className="rounded-t bg-layer-1 p-2 text-sm font-semibold text-primary">Visited</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-b bg-layer-2">
              {MindmapColorVisitedFieldNamesList.map(fieldName => (
                <div key={`${fieldName}_subHeader`} className="w-[160px] p-2 italic">
                  {fieldName}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {branches.map((branch, i) => (
        <div key={i} className="relative inline-flex min-w-[1210px] gap-2">
          <div className="flex gap-6">
            <div className="w-[664px]">
              <div className="flex items-center gap-2">
                {MindmapColorDefaultFieldsList.map(fieldName => (
                  <ColorPickerInput
                    name={`${i}${FIELD_NAME_DIVIDER}${fieldName}`}
                    color={branch[fieldName] ?? ''}
                    onCommit={handleBranchCommit}
                    key={`${i}${FIELD_NAME_DIVIDER}${fieldName}`}
                    mandatory={MindmapColorMandatoryFieldsList.includes(fieldName)}
                  />
                ))}
              </div>
            </div>
            <div className="w-[496px]">
              <div className="flex items-center gap-2">
                {MindmapColorVisitedFieldsList.map(fieldName => (
                  <ColorPickerInput
                    name={`${i}${FIELD_NAME_DIVIDER}${fieldName}`}
                    color={branch[fieldName] ?? ''}
                    onCommit={handleBranchCommit}
                    key={`${i}${FIELD_NAME_DIVIDER}${fieldName}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            className={classNames([
              'sticky inset-y-0 right-0 z-10',
              'flex items-center justify-center',
              'bg-layer-3 px-2 h-[34px]',
              'text-secondary',
              branches.length <= 1 ? 'cursor-not-allowed' : 'cursor-pointer hover:text-accent-primary',
            ])}
            onClick={() => handleRemoveBranch(i)}
            disabled={branches.length <= 1}
          >
            {<IconX />}
          </button>
        </div>
      ))}
      <button
        className="sticky left-2 flex w-fit items-center text-accent-primary"
        onClick={() => dispatch(AppearanceActions.addBranchGroup({ theme }))}
      >
        <IconPlus size={18} /> Add new group
      </button>
    </div>
  );
};
