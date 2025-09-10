import { Icon, IconProps } from '@tabler/icons-react';
import classNames from 'classnames';
import React, { FC, ForwardRefExoticComponent, MouseEventHandler, RefAttributes } from 'react';

import Tooltip from '../../common/Tooltip';

export interface IconButtonProps {
  Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
  tooltip: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  dataQa?: string;
}

const IconButton: FC<IconButtonProps> = ({ Icon, tooltip, disabled = false, onClick, className, dataQa }) => {
  const baseClasses =
    'h-[34px] w-[34px] flex justify-center items-center rounded hover:bg-accent-primary-alpha hover:text-accent-primary disabled:cursor-default disabled:text-controls-disable disabled:bg-layer-3';

  return (
    <Tooltip tooltip={tooltip} contentClassName="text-sm px-2 text-primary">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={classNames(baseClasses, className)}
        data-testid={dataQa}
      >
        <Icon size={24} height={24} width={24} stroke={1.5} />
      </button>
    </Tooltip>
  );
};

export default IconButton;
