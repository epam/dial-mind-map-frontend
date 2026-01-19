import { IconFileDescription } from '@tabler/icons-react';

import { Space } from '@/components/common/Space/Space';
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
}) => {
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
          </Space>
        </div>
      </td>
    </tr>
  );
};
