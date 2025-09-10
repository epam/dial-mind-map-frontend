import { IconDots, IconDownload, IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';
import React, { FC } from 'react';

import ContextMenu from '@/components/builder/common/ContextMenu';
import Tooltip from '@/components/builder/common/Tooltip';
import { useBuilderDispatch } from '@/store/builder/hooks';
import { SourcesActions } from '@/store/builder/sources/sources.reducers';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { DisplayMenuItemProps } from '@/types/menu';
import { CreateSource, Source, SourceStatus, SourceType } from '@/types/sources';

interface ActionMenuProps {
  original: Source;
  hovered: boolean;
  handleAddVersion: (source: CreateSource) => void;
}

export const ActionMenu: FC<ActionMenuProps> = ({ original, hovered, handleAddVersion }) => {
  const dispatch = useBuilderDispatch();

  const elements: DisplayMenuItemProps[] = [];

  if (!hovered) return null;

  if (original.status === SourceStatus.FAILED) {
    elements.push({
      dataQa: 'reindex',
      name: 'Reindex',
      Icon: IconRefresh,
      className: 'text-sm',
      iconClassName: '!text-error',
      onClick: () => {
        if (original.type === SourceType.LINK) {
          handleAddVersion({ link: original.url, sourceId: original.id, versionId: original.version });
        } else {
          dispatch(UIActions.setSourceIdToAddVersion(original.id));
        }
      },
    });
  }
  if (original.id && original.version) {
    elements.push({
      dataQa: 'download',
      name: 'Download',
      Icon: IconDownload,
      className: 'text-sm',
      onClick: () => {
        if (original.id && original.version) {
          dispatch(
            SourcesActions.downloadSource({
              sourceId: original.id,
              versionId: original.version,
              name: original.name ?? original.url,
            }),
          );
        }
      },
    });
  }

  if (elements.length === 0) return null;

  const limit = elements.length > 3 ? 2 : 3;
  const visibleItems = elements.slice(0, limit);
  const hiddenItems = elements.slice(limit);

  return (
    <div className="mr-4 flex items-center justify-end gap-2 p-2">
      {visibleItems.map(({ name, dataQa, Icon, onClick, iconClassName }) => (
        <Tooltip key={dataQa} tooltip={name} contentClassName="text-sm px-2 text-primary">
          <button data-testid={dataQa} type="button" onClick={onClick}>
            {Icon && <Icon size={18} height={18} width={18} className={classNames('text-secondary', iconClassName)} />}
          </button>
        </Tooltip>
      ))}
      {hiddenItems.length > 0 && (
        <ContextMenu
          TriggerIcon={IconDots}
          className="z-50"
          triggerIconClassName="flex cursor-pointer items-center"
          triggerIconHighlight
          triggerIconSize={18}
          menuItems={hiddenItems}
        />
      )}
    </div>
  );
};
