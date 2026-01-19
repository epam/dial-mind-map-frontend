import { IconDotsVertical, IconFlagCheck, IconRefresh, IconTrashX } from '@tabler/icons-react';

import Tooltip from '@/components/builder/common/Tooltip';
import Button from '@/components/common/Button/Button';
import GroupButtons from '@/components/common/GroupButtons/GroupButtons';
import { BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';
import { SettingsSelectors } from '@/store/builder/settings/settings.reducers';
import { GenerationStatus } from '@/types/sources';

interface Props {
  generationStatus: GenerationStatus | null;
  isValid: boolean;
  fieldsLength: number;
  hasFailedSource: boolean;
  selectedRowsLength: number;
  totalActiveSourcesTokens: number;
  isLiteMode: boolean;
  onGenerate: () => void;
  onApplySelection: () => void;
  onDeleteSelection: () => void;
  onReindexSelection: () => void;
  onMarkAsAppliedSelection: () => void;
}

export const SourceEditorFooter: React.FC<Props> = ({
  generationStatus,
  isValid,
  fieldsLength,
  hasFailedSource,
  selectedRowsLength,
  totalActiveSourcesTokens,
  isLiteMode,
  onGenerate,
  onApplySelection,
  onDeleteSelection,
  onReindexSelection,
  onMarkAsAppliedSelection,
}) => {
  const tokensLimit = useBuilderSelector(SettingsSelectors.selectGenerationSourcesTokensLimit);
  const currentModelId = useBuilderSelector(BuilderSelectors.selectCurrentModelId);
  const currentChatModelId = useBuilderSelector(BuilderSelectors.selectChatModelId);

  const areModelsSelected = !!currentModelId && !!currentChatModelId;
  const isOverTokensLimit = isLiteMode && !!tokensLimit && totalActiveSourcesTokens > tokensLimit;
  const disabledGenerate =
    !isValid || fieldsLength === 0 || hasFailedSource || isOverTokensLimit || (isLiteMode && !areModelsSelected);

  const getTooltipMessage = () => {
    if (isOverTokensLimit) {
      return `Token limit of ${new Intl.NumberFormat().format(tokensLimit)} exceeded. Adjust your sources.`;
    }

    if (isLiteMode && !areModelsSelected) {
      return 'Models must be selected before generating.';
    }

    return disabledGenerate
      ? 'Cannot generate while sources are processing or have errors. Please resolve all sources first.'
      : 'Generate graph';
  };

  if (generationStatus === GenerationStatus.NOT_STARTED) {
    return (
      <div className="flex justify-end border-t border-tertiary px-6 py-4">
        <Tooltip contentClassName="text-sm px-2 text-primary" tooltip={getTooltipMessage()}>
          <Button disabled={disabledGenerate} variant="primary" label="Generate Graph" onClick={onGenerate} />
        </Tooltip>
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
          <Tooltip contentClassName="text-sm px-2 text-primary" tooltip="Mark as applied">
            <Button variant="icon" icon={<IconFlagCheck />} onClick={onMarkAsAppliedSelection} />
          </Tooltip>
        </GroupButtons>
        {!isLiteMode && (
          <Tooltip contentClassName="text-sm px-2 text-primary" tooltip="Apply to graph">
            <Button variant="primary" label="Apply to graph" onClick={onApplySelection} />
          </Tooltip>
        )}
      </div>
    );
  }

  return null;
};
