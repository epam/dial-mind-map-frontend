import classNames from 'classnames';
import React, { ReactElement, useLayoutEffect, useRef, useState } from 'react';

import { Menu, MenuItem } from '@/components/builder/common/DropdownMenu';

export type Mode = 'auto' | 'dropdown-only';

export interface GroupButtonsProps {
  /** Only button-like elements (DOM <button> or forwardRef’d components) */
  children: ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>[];
  className?: string;
  moreLabel?: React.ReactNode;
  menuClassName?: string;
  mode?: Mode;
}

const GroupButtons: React.FC<GroupButtonsProps> = ({
  children,
  className,
  moreLabel = 'More',
  menuClassName,
  mode = 'auto',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  const items = children;

  const updateLayout = React.useCallback(() => {
    if (mode === 'dropdown-only') {
      setVisibleCount(0);
      return;
    }
    const c = containerRef.current;
    const m = moreRef.current;
    if (!c || !m) return;

    const cw = c.offsetWidth;
    const mw = m.offsetWidth;
    let used = 0;
    let count = items.length;

    for (let i = 0; i < items.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const w = el.offsetWidth;
      if (used + w > cw - (i < items.length - 1 ? mw : 0)) {
        count = i;
        break;
      }
      used += w;
    }
    setVisibleCount(count);
  }, [items, mode]);

  useLayoutEffect(() => {
    updateLayout();
    if (mode === 'auto') {
      const ro = new ResizeObserver(updateLayout);
      if (containerRef.current) ro.observe(containerRef.current);
      window.addEventListener('resize', updateLayout);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', updateLayout);
      };
    }
  }, [items, mode, updateLayout]);

  const visibleItems = items.slice(0, visibleCount);
  const hiddenItems = items.slice(visibleCount);

  return (
    <div ref={containerRef} className={classNames('flex items-center', className)}>
      {visibleItems.map((btn, i) => {
        // if it’s a real button element:
        if (typeof btn.type === 'string' && btn.type === 'button') {
          return React.cloneElement(btn, {
            key: btn.key ?? i,
            className: classNames(btn.props.className),
            ref: (el: HTMLButtonElement | null) => (itemRefs.current[i] = el),
          } as any);
        }

        // otherwise wrap it in a <span> that we can measure:
        return (
          <span
            key={btn.key ?? i}
            ref={el => {
              if (el) {
                // measure el.offsetWidth
                itemRefs.current[i] = el as any;
              }
            }}
            className="inline-block"
          >
            {btn}
          </span>
        );
      })}

      {hiddenItems.length > 0 && (
        <Menu
          trigger={
            <button ref={moreRef} className="rounded bg-layer-1 px-3 py-1">
              {moreLabel}
            </button>
          }
          listClassName={menuClassName}
        >
          {hiddenItems.map((btn, i) => (
            <MenuItem key={btn.key ?? i} onClick={btn.props.onClick} disabled={btn.props.disabled}>
              {btn}
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  );
};

export default GroupButtons;
