import { IconPointFilled } from '@tabler/icons-react';
import { FC } from 'react';

import Tooltip from '@/components/builder/common/Tooltip';
import Loader from '@/components/common/Loader';
import { SourceStatus } from '@/types/sources';

interface SourceStatusIndicatorProps {
  status?: SourceStatus;
  inGraph?: boolean;
  statusDescription?: string;
}

export const SourceStatusIndicator: FC<SourceStatusIndicatorProps> = ({ status, inGraph, statusDescription }) => {
  if (!status || status === SourceStatus.INPROGRESS) {
    return <Loader size={16} containerClassName="absolute left-[-20px] !w-fit" loaderClassName="!text-primary" />;
  }

  if (status === SourceStatus.FAILED) {
    return (
      <Tooltip
        tooltip={statusDescription}
        triggerClassName="absolute left-[-20px]"
        contentClassName="text-xs px-2 text-primary"
      >
        <IconPointFilled size={20} className="text-error" />
      </Tooltip>
    );
  }

  if (!inGraph || status === SourceStatus.REMOVED) {
    return (
      <Tooltip
        tooltip="Hasn't been applied to the graph. The knowledge base has been updated."
        triggerClassName="absolute left-[-20px]"
        contentClassName="text-xs px-2 text-primary"
      >
        <IconPointFilled size={20} className="text-warning" />
      </Tooltip>
    );
  }

  return null;
};
