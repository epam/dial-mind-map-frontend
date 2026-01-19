import { IconCircleCheck, IconEye, IconFileBroken } from '@tabler/icons-react';
import classNames from 'classnames';
import { type JSX, memo } from 'react';

import { NodeStatusDict } from '@/constants/app';
import { NodeStatus } from '@/types/graph';

type StatusConfig = {
  icon: JSX.Element;
  bgColor: string;
  borderColor: string;
};

const statusConfigMap: Record<NodeStatus, StatusConfig> = {
  [NodeStatus.Draft]: {
    icon: <IconFileBroken data-testid="draft-icon" size={16} className="text-secondary" />,
    bgColor: 'bg-layer-2',
    borderColor: 'border-primary',
  },
  [NodeStatus.ReviewRequired]: {
    icon: <IconEye data-testid="review-required-icon" size={16} className="stroke-warning" />,
    bgColor: 'bg-warning',
    borderColor: 'border-warning',
  },
  [NodeStatus.Reviewed]: {
    icon: <IconCircleCheck data-testid="reviewed-icon" size={16} className="stroke-success" />,
    bgColor: 'bg-success',
    borderColor: 'border-success',
  },
};

const StatusCell = ({ status }: { status?: NodeStatus }) => {
  if (!status || !statusConfigMap[status]) return null;

  const { icon, bgColor, borderColor } = statusConfigMap[status];

  return (
    <div
      className={classNames('flex gap-1 items-center rounded-[3px] px-[6px] h-6 w-fit border', bgColor, borderColor)}
    >
      {icon}
      <span className="text-xs">{NodeStatusDict[status]}</span>
    </div>
  );
};

export default memo(StatusCell);
