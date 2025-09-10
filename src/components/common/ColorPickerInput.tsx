import { IconHelpCircle, IconReload } from '@tabler/icons-react';
import { useDebounceFn } from 'ahooks';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import Tooltip from '../builder/common/Tooltip';
import Button from './Button/Button';

const DEBOUNCE_DELAY = 500;

interface ColorPickerInputProps {
  /** Field label */
  label?: string;
  /** Unique color key/name */
  name: string;
  /** Current hex color value */
  color: string;
  /** Commit change when editing finishes or on change */
  onCommit: (name: string, finalValue: string) => void;
  /** Optional help tooltip content */
  infoTooltip?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether the field is mandatory */
  mandatory?: boolean;
  /** Debounce delay in ms */
  debounceDelay?: number;
  /** Optional class name for the label */
  labelClassName?: string;
}

export const ColorPickerInput: React.FC<ColorPickerInputProps> = ({
  label,
  name,
  color,
  onCommit,
  infoTooltip,
  className,
  mandatory = false,
  debounceDelay = DEBOUNCE_DELAY,
  labelClassName,
}) => {
  const [localColor, setLocalColor] = useState(color);

  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  const { run: debouncedCommit } = useDebounceFn((val: string) => onCommit(name, val), { wait: debounceDelay });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalColor(val);
    debouncedCommit(val);
  };

  const isValidHex = useMemo(() => /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(localColor), [localColor]);

  const handleReset = () => {
    setLocalColor('');
    onCommit(name, '');
  };

  const showErrorOverlay = !!localColor && !isValidHex;
  const showEmptyOverlay = !localColor;
  const overlayNeeded = showErrorOverlay || showEmptyOverlay;
  const pickerBg = localColor && !showErrorOverlay ? localColor : 'transparent';

  return (
    <div
      className={classNames(
        'grid items-center gap-x-2',
        !label ? 'grid-cols-[160px]' : 'grid-cols-[110px_160px]',
        className,
      )}
    >
      {label && (
        <div className="flex items-center space-x-1">
          <span className={classNames('pl-2 text-sm text-primary', labelClassName)}>{label}</span>
          {infoTooltip && (
            <Tooltip
              isTriggerClickable
              placement="top"
              triggerClassName="inline-block"
              contentClassName="text-sm px-2 text-primary"
              tooltip={infoTooltip}
            >
              <IconHelpCircle className="size-4 cursor-pointer text-secondary" />
            </Tooltip>
          )}
        </div>
      )}

      <div
        className={classNames(
          'flex items-center space-x-2 rounded border border-primary px-2 py-1',
          mandatory && !localColor && '!border-error',
          !isValidHex && localColor && '!border-error',
        )}
      >
        <Tooltip
          isTriggerClickable
          placement="right"
          triggerClassName="inline-block"
          contentClassName="p-2 bg-layer-0 rounded shadow"
          tooltip={
            <div className="flex flex-col space-y-2 rounded bg-layer-0 p-2">
              <HexColorPicker
                color={localColor || ''}
                onChange={val => {
                  setLocalColor(val);
                  debouncedCommit(val);
                }}
              />
              {!mandatory && (
                <Button
                  disabled={!localColor}
                  onClick={handleReset}
                  label="Auto color"
                  variant="primary"
                  icon={<IconReload />}
                  dataTestId="color-picker-reset-button"
                />
              )}
            </div>
          }
        >
          <button
            className={classNames(
              'size-6 cursor-pointer rounded border flex items-center justify-center border-primary',
              { '!border-error': showErrorOverlay, relative: overlayNeeded },
            )}
            style={{ backgroundColor: pickerBg }}
          >
            {overlayNeeded && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="block h-full w-px rotate-45 border-l-2 border-error" />
              </span>
            )}
          </button>
        </Tooltip>

        <input
          id={`${name}-input`}
          type="text"
          value={localColor || ''}
          placeholder={mandatory && !localColor ? 'Error' : 'Auto'}
          onChange={handleChange}
          className="h-6 w-[90px] rounded bg-layer-3 px-2 text-sm text-primary"
        />
      </div>
    </div>
  );
};
