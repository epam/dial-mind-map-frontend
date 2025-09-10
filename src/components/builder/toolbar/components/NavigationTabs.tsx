import classNames from 'classnames';
import Link from 'next/link';
import React, { FC } from 'react';

import { GenerationStatus } from '@/types/sources';

import { useToolbarRouting } from '../hooks/useToolbarRouting';

export enum LinkPathname {
  Sources = '/sources',
  Content = '/content',
  Customize = '/customize',
}

interface NavigationTabItem {
  label: string;
  path: LinkPathname;
  disabled: boolean;
}

interface NavigationTabsProps {
  isMessageStreaming: boolean;
  generationStatus: GenerationStatus | null;
}

export const NavigationTabs: FC<NavigationTabsProps> = ({ isMessageStreaming, generationStatus }) => {
  const { pathname, getRouteQuery } = useToolbarRouting();
  const queryString = getRouteQuery();

  const baseLinkClass = 'flex gap-2 px-3 py-[14px] text-sm hover:text-accent-primary relative whitespace-nowrap';
  const disabledClass = 'text-controls-disable hover:text-controls-disable hover:cursor-default pointer-events-none';

  const tabs: NavigationTabItem[] = [
    {
      label: 'Sources',
      path: LinkPathname.Sources,
      disabled: isMessageStreaming,
    },
    {
      label: 'Content',
      path: LinkPathname.Content,
      disabled: generationStatus !== GenerationStatus.FINISHED || isMessageStreaming,
    },
    {
      label: 'Customize',
      path: LinkPathname.Customize,
      disabled: generationStatus !== GenerationStatus.FINISHED || isMessageStreaming,
    },
  ];

  return (
    <div className="relative flex items-center px-2 text-primary">
      {tabs.map(({ label, path, disabled }) => {
        const href = `${path}?${queryString}`;
        const isActive = pathname === path;
        return (
          <Link
            key={path}
            href={href}
            className={classNames(baseLinkClass, isActive && 'text-accent-primary', disabled && disabledClass)}
            tabIndex={disabled ? -1 : undefined}
            onClick={e => disabled && isActive && e.preventDefault()}
          >
            {label}
            {isActive && <span className="absolute bottom-px left-0 w-full border-b border-accent-primary" />}
          </Link>
        );
      })}
    </div>
  );
};
