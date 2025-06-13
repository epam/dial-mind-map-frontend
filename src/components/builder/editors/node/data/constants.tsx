import { IconCircleCheck, IconEye, IconFileBroken } from '@tabler/icons-react';

import { NodeStatusDict } from '@/constants/app';

import { SelectOption } from '../components/StatusSelector';

export const statusOptions: SelectOption[] = [
  {
    value: 'draft',
    label: NodeStatusDict['draft'],
    backgroundColor: 'var(--bg-layer-2)',
    borderColor: 'var(--stroke-primary)',
    icon: <IconFileBroken size={16} className="text-secondary" />,
  },
  {
    value: 'review-required',
    label: NodeStatusDict['review-required'],
    backgroundColor: 'var(--bg-warning)',
    borderColor: 'var(--stroke-warning)',
    icon: <IconEye size={16} className="stroke-warning" />,
  },
  {
    value: 'reviewed',
    label: NodeStatusDict['reviewed'],
    backgroundColor: 'var(--bg-success)',
    borderColor: 'var(--stroke-success)',
    icon: <IconCircleCheck size={16} className="stroke-success" />,
  },
];
