import { IconDotsVertical, IconRefresh, IconTrashX } from '@tabler/icons-react';

import Tooltip from '@/components/builder/common/Tooltip';
import Button from '@/components/common/Button/Button';
import GroupButtons from '@/components/common/GroupButtons/GroupButtons';
import { Space } from '@/components/common/Space/Space';
import { ToggleSwitch } from '@/components/common/ToggleSwitch/ToggleSwitch';
import { GenerationStatus } from '@/types/sources';

interface Props {
  generationStatus: GenerationStatus | null;
  isValid: boolean;
  fieldsLength: number;
  hasFailedSource: boolean;
  selectedRowsLength: number;
  onGenerate: () => void;
  onApplySelection: () => void;
  onDeleteSelection: () => void;
  onReindexSelection: () => void;
  showSimpleModeSwitcher?: boolean;
  onToggleSimpleMode: (checked: boolean) => void;
}

export const SourceEditorFooter: React.FC<Props> = ({
  generationStatus,
  isValid,
  fieldsLength,
  hasFailedSource,
  selectedRowsLength,
  onGenerate,
  onApplySelection,
  onDeleteSelection,
  onReindexSelection,
  onToggleSimpleMode,
  showSimpleModeSwitcher = false,
}) => {
  const disabledGenerate = !isValid || fieldsLength === 0 || hasFailedSource;

  if (generationStatus === GenerationStatus.NOT_STARTED) {
    return (
      <div className="flex justify-end border-t border-tertiary px-6 py-4">
        {showSimpleModeSwitcher && (
          <Space size="middle" className="px-5">
            <label htmlFor="node-highlight" className="mb-1 flex min-w-20 items-center text-sm">
              Simple mode:
            </label>
            <ToggleSwitch
              isOn={false}
              switchOnText="ON"
              switchOFFText="OFF"
              handleSwitch={(e: React.ChangeEvent<HTMLInputElement>) => {
                onToggleSimpleMode(e.target.checked);
              }}
            />
          </Space>
        )}

        <Tooltip
          contentClassName="text-sm px-2 text-primary"
          tooltip={
            disabledGenerate
              ? 'Cannot generate while sources are processing or have errors. Please resolve all sources first.'
              : 'Generate graph'
          }
        >
          <Button disabled={disabledGenerate} variant="primary" label="Generate Graph" onClick={onGenerate} />
        </Tooltip>
      </div>
    );
  }

  if (showSimpleModeSwitcher && selectedRowsLength === 0) {
    return (
      <div className="flex justify-between border-t border-tertiary px-6 py-4">
        <Space size="middle" className="px-5">
          <label htmlFor="node-highlight" className="mb-1 flex min-w-20 items-center text-sm">
            Simple mode:
          </label>

          <ToggleSwitch
            isOn={false}
            switchOnText="ON"
            switchOFFText="OFF"
            handleSwitch={(e: React.ChangeEvent<HTMLInputElement>) => {
              onToggleSimpleMode(e.target.checked);
            }}
          />
        </Space>
      </div>
    );
  }

  if (selectedRowsLength > 0) {
    return (
      <div className="flex justify-between border-t border-tertiary px-6 py-4">
        <GroupButtons moreLabel={<IconDotsVertical />}>
          <Tooltip contentClassName="text-sm px-2 text-primary" tooltip="Delete selected sources">
            <Button variant="icon" icon={<IconTrashX />} onClick={onDeleteSelection} />
          </Tooltip>
          <Tooltip contentClassName="text-sm px-2 text-primary" tooltip="Reindex selected sources">
            <Button variant="icon" icon={<IconRefresh />} onClick={onReindexSelection} />
          </Tooltip>
        </GroupButtons>
        <Tooltip contentClassName="text-sm px-2 text-primary" tooltip="Apply to graph">
          <Button variant="primary" label="Apply to graph" onClick={onApplySelection} />
        </Tooltip>
      </div>
    );
  }

  return null;
};
