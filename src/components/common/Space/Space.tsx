import classNames from 'classnames';
import React, { Ref, useMemo } from 'react';

interface SpaceProps {
  /** Content elements to be spaced */
  children: React.ReactNode;
  /** Layout direction: horizontal (default) or vertical */
  direction?: 'horizontal' | 'vertical';
  /**
   * Spacing between items.
   * Can be a number (in pixels) or one of the preset sizes: 'small', 'middle', or 'large'.
   */
  size?: number | 'small' | 'middle' | 'large';
  /** Whether to allow wrapping of items (defaults to false) */
  wrap?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /**
   * Alignment of items.
   * Available values: 'start', 'end', 'center', 'baseline', 'stretch'.
   * Default is 'center'.
   */
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  /**
   * Justification of items.
   * Available values: 'normal', 'start', 'end', 'center', 'between', 'around', 'evenly'.
   * Default is 'normal'.
   */
  justify?: 'normal' | 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  /** Full width container when true */
  fullWidth?: boolean;
  /** Data-testid for testing purposes */
  dataTestId?: string;
  /** Ref object */
  ref?: Ref<HTMLDivElement>;
}

const gapMapping: Record<string, string> = {
  small: 'gap-2',
  middle: 'gap-4',
  large: 'gap-6',
};

export const Space: React.FC<SpaceProps> = ({
  children,
  direction = 'horizontal',
  size = 'small',
  wrap = false,
  className,
  style,
  dataTestId,
  align = 'center',
  justify = 'normal',
  fullWidth = false,
  ref,
}) => {
  const flexDirection = useMemo(() => (direction === 'horizontal' ? 'flex-row' : 'flex-col'), [direction]);

  const flexWrap = useMemo(() => (wrap ? 'flex-wrap' : ''), [wrap]);

  const gapClass = useMemo(() => {
    return typeof size === 'string' ? gapMapping[size] || gapMapping.small : '';
  }, [size]);

  const computedStyle = useMemo(() => {
    const newStyle = { ...style } as React.CSSProperties;
    if (typeof size === 'number') {
      newStyle.gap = `${size}px`;
    }
    return newStyle;
  }, [size, style]);

  const alignClass = useMemo(() => `items-${align}`, [align]);
  const justifyClass = useMemo(() => `justify-${justify}`, [justify]);
  const widthClass = useMemo(() => (fullWidth ? 'w-full' : ''), [fullWidth]);

  const spaceClass = useMemo(
    () => classNames('flex', flexDirection, gapClass, flexWrap, alignClass, justifyClass, widthClass, className),
    [flexDirection, gapClass, flexWrap, alignClass, justifyClass, widthClass, className],
  );

  return (
    <div className={spaceClass} style={computedStyle} data-testid={dataTestId} ref={ref}>
      {children}
    </div>
  );
};
