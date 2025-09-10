import { IconDotsVertical } from '@tabler/icons-react';
import classNames from 'classnames';
import groupBy from 'lodash-es/groupBy';
import { Fragment, useMemo } from 'react';

import { ContextMenuProps, MenuItemRendererProps } from '@/types/menu';

import { Spinner } from '../../common/Spinner';
import { Menu, MenuItem } from './DropdownMenu';
import Tooltip from './Tooltip';

function ContextMenuItemRenderer({
  name,
  additionalNameNode,
  Icon,
  iconClassName = 'text-secondary',
  onClick,
  disabled,
  className,
  childMenuItems,
  onChildMenuOpenChange,
  useStandardColor,
}: MenuItemRendererProps) {
  const item = (
    <div
      className={classNames(
        'flex w-full items-center gap-3 truncate break-words',
        !!childMenuItems && !disabled && 'text-primary',
        !!childMenuItems && className,
      )}
    >
      {Icon && (
        <Icon
          className={classNames('shrink-0', disabled ? 'text-controls-disable' : iconClassName)}
          size={18}
          height={18}
          width={18}
        />
      )}
      <span className="truncate break-words">
        {name} {additionalNameNode}
      </span>
    </div>
  );
  if (childMenuItems && !disabled) {
    return (
      <ContextMenu
        menuItems={childMenuItems}
        triggerIconClassName={classNames(className, 'text-secondary', 'hover:bg-accent-primary-alpha')}
        TriggerCustomRenderer={item}
        onOpenChange={onChildMenuOpenChange}
        useStandardColor={useStandardColor}
      />
    );
  }
  return (
    <MenuItem
      className={classNames(disabled ? 'text-secondary' : 'hover:bg-accent-primary-alpha', className)}
      item={item}
      onClick={onClick}
      disabled={disabled}
    />
  );
}

export default function ContextMenu({
  menuItems,
  TriggerIcon = IconDotsVertical,
  triggerIconSize = 24,
  className,
  triggerIconHighlight,
  TriggerCustomRenderer,
  triggerIconClassName,
  triggerTooltip,
  disabled,
  isOpen,
  onOpenChange,
  isLoading,
  placement,
  useStandardColor,
  menuOffset = 0,
}: ContextMenuProps) {
  const displayedMenuItems = useMemo(() => menuItems.filter(({ display = true }) => !!display), [menuItems]);

  if (!displayedMenuItems.length) return null;

  const menuContent = TriggerCustomRenderer || (
    <TriggerIcon
      size={triggerIconSize}
      width={triggerIconSize}
      height={triggerIconSize}
      strokeWidth={1.5}
      onClick={e => {
        e.stopPropagation();
      }}
    />
  );

  if (isLoading && isOpen) return <Spinner size={18} />;

  const groups = groupBy(displayedMenuItems, 'groupId');
  const groupsNames = Object.keys(groups);

  const elements = groupsNames.map((groupName, groupIndex) => (
    <div key={groupName} className={classNames(groupIndex !== 0 && 'border-t border-t-secondary')}>
      {groups[groupName].map(({ CustomTriggerRenderer, ...props }) => {
        const Renderer = CustomTriggerRenderer ? (
          <CustomTriggerRenderer {...props} Renderer={ContextMenuItemRenderer} useStandardColor={useStandardColor} />
        ) : (
          <ContextMenuItemRenderer {...props} useStandardColor={useStandardColor} />
        );
        return <Fragment key={props.dataQa}>{Renderer}</Fragment>;
      })}
    </div>
  ));

  return (
    <Menu
      placement={placement}
      className={triggerIconClassName}
      listClassName={classNames(!useStandardColor && 'context-menu-chat')}
      disabled={disabled}
      type="contextMenu"
      onOpenChange={onOpenChange}
      isMenuOpen={isOpen}
      menuOffset={menuOffset}
      trigger={
        <div
          data-qa="menu-trigger"
          className={classNames(
            'flex w-full items-center justify-center rounded text-secondary',
            triggerIconHighlight && 'hover:text-primary',
            className,
          )}
        >
          {triggerTooltip ? (
            <Tooltip isTriggerClickable tooltip={triggerTooltip}>
              {menuContent}
            </Tooltip>
          ) : (
            menuContent
          )}
        </div>
      }
    >
      {!isLoading && elements}
    </Menu>
  );
}
