import classNames from 'classnames';
import React from 'react';

import Tooltip from '@/components/builder/common/Tooltip';

export interface ToggleOption<T extends string> {
  /** Button label shown to the user */
  label: string;
  /** Underlying value associated with this option */
  value: T;
  /** Optional class name for the button */
  className?: string;
  /** Optional class name for the active button */
  buttonActiveClassName?: string;
  /** Whether toggle option is disabled or not */
  disabled?: boolean;
  /** Tooltip message for disabled option */
  tooltipText?: string;
}

export interface ToggleGroupProps<T extends string> {
  /** Array of options with label and value */
  options: ToggleOption<T>[];
  /** Currently selected value */
  value: T;
  /** Called when user selects a different value */
  onChange: (val: T) => void;
  /** Extra classes for the wrapper */
  className?: string;
  /** Extra classes for each button */
  buttonClassName?: string;
}

/**
 * A generic toggle-group component rendering a row of buttons.
 * Highlights the active button and calls onChange when another is clicked.
 */
export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  buttonClassName,
}: ToggleGroupProps<T>) {
  return (
    <div className={classNames('inline-flex space-x-3', className)}>
      {options.map(opt => {
        const isActive = opt.value === value;

        return (
          <Tooltip
            key={opt.value}
            tooltip={opt.tooltipText}
            hideTooltip={!opt.tooltipText}
            contentClassName="text-xs px-2 py-1 text-primary"
          >
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              disabled={opt.disabled}
              className={classNames(
                'px-3 py-2 text-sm border-2 rounded-xl hover:shadow',
                buttonClassName,
                {
                  'border-accent-primary': isActive,
                  'border-primary hover:border-accent-primary': !isActive,
                },
                isActive && opt.buttonActiveClassName,
                opt.className,
              )}
            >
              {opt.label}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
