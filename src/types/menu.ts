import { Placement } from '@floating-ui/react';
import { Icon, IconProps } from '@tabler/icons-react';
import { FC, ForwardRefExoticComponent, MouseEventHandler, ReactNode, RefAttributes } from 'react';

export interface CustomTriggerMenuRendererProps extends MenuItemRendererProps {
  Renderer: (props: MenuItemRendererProps) => JSX.Element;
}

export type onClickMenuItemHandler = MouseEventHandler<unknown> | ((props?: unknown) => void);

export interface DisplayMenuItemProps {
  display?: boolean;
  name: string;
  additionalNameNode?: ReactNode;
  disabled?: boolean;
  Icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
  iconClassName?: string;
  dataQa: string;
  onClick?: onClickMenuItemHandler;
  CustomTriggerRenderer?: FC<CustomTriggerMenuRendererProps>;
  customTriggerData?: unknown;
  className?: string;
  groupId?: string;
  childMenuItems?: DisplayMenuItemProps[];
  onChildMenuOpenChange?: (isOpen: boolean) => void;
}

export type MenuItemRendererProps = DisplayMenuItemProps & {
  useStandardColor?: boolean;
};

export interface MenuProps {
  menuItems: DisplayMenuItemProps[];
  displayMenuItemCount?: number;
  className?: string;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  useStandardColor?: boolean;
}

export interface ContextMenuProps extends MenuProps {
  TriggerIcon?: (props: IconProps) => ReactNode;
  triggerIconSize?: number;
  triggerIconHighlight?: boolean;
  triggerIconClassName?: string;
  triggerTooltip?: string;
  TriggerCustomRenderer?: JSX.Element;
  isLoading?: boolean;
  placement?: Placement;
  menuOffset?: number;
}
