import { IconFileDescription } from '@tabler/icons-react';

import { Space } from '@/components/common/Space/Space';
import { ToggleSwitch } from '@/components/common/ToggleSwitch/ToggleSwitch';
import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { GenerationType } from '@/types/generate';
import { CreateSource } from '@/types/sources';

import { SourceActions } from './SourceActions';

interface Props {
  columnsCount: number;
  isValid: boolean;
  editableIndex: number | null;
  handleAddSource: ({ file, link }: CreateSource) => Promise<void>;
  handleSelectFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSimpleGenerationModeAvailable?: boolean;
}

export const EmptyTableState: React.FC<Props> = ({
  columnsCount,
  isValid,
  handleAddSource,
  handleSelectFiles,
  editableIndex,
  isSimpleGenerationModeAvailable = false,
}) => {
  const dispatch = useBuilderDispatch();
  const generationType = useBuilderSelector(BuilderSelectors.selectGenerationType);
  const currentParams = useBuilderSelector(BuilderSelectors.selectGenerateParams);

  const onSetGenerationType = (checked: boolean) => {
    dispatch(
      BuilderActions.updateGenerateParams({
        ...currentParams,
        type: checked ? GenerationType.Simple : GenerationType.Universal,
      }),
    );
  };

  return (
    <tr>
      <td colSpan={columnsCount}>
        <div className="flex h-[calc(100vh-164px)] flex-col items-center justify-center text-center">
          <Space className="w-[260px]" direction="vertical" size="large">
            <IconFileDescription size={80} className="text-secondary" strokeWidth={1} />

            <p className="text-lg text-primary">Add sources to get started!</p>
            <p className="text-secondary">Create a list of sources to generate the starting graph</p>
            <SourceActions
              isValid={isValid}
              editableIndex={editableIndex}
              handleAddSource={handleAddSource}
              handleSelectFiles={handleSelectFiles}
            />
            {isSimpleGenerationModeAvailable && generationType !== GenerationType.Simple && (
              <Space size="middle" className="px-5">
                <label htmlFor="node-highlight" className="mb-1 flex min-w-20 items-center text-sm">
                  Simple mode:
                </label>

                <ToggleSwitch
                  isOn={false}
                  switchOnText="ON"
                  switchOFFText="OFF"
                  handleSwitch={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onSetGenerationType(e.target.checked);
                  }}
                />
              </Space>
            )}
          </Space>
        </div>
      </td>
    </tr>
  );
};
