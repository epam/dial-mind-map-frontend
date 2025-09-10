import { Icon, IconProps } from '@tabler/icons-react';
import classNames from 'classnames';
import { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';

interface FormSectionProps {
  withBorder?: boolean;
  children?: ReactNode;
  Icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
  title?: string;
  titleClassName?: string;
  className?: string;
  wrapperClassName?: string;
}

export const FormSection = ({
  title,
  children,
  withBorder,
  className,
  wrapperClassName,
  Icon,
  titleClassName,
}: FormSectionProps) => {
  return (
    <div
      className={classNames([
        'flex w-full p-6 flex-col lg:flex-row',
        withBorder && 'border-b border-primary',
        children && 'gap-4',
        className,
      ])}
    >
      {title && (
        <div className={classNames('flex', Icon && 'gap-2')}>
          {Icon && <Icon size={18} className="text-secondary" />}
          <span className={classNames('min-w-[200px] flex-none text-base font-semibold text-primary', titleClassName)}>
            {title}
          </span>
        </div>
      )}
      <div className={classNames(['flex-1 px-2', wrapperClassName])}>{children}</div>
    </div>
  );
};
