import classNames from 'classnames';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
  /** HTML type of the button (submit | reset | button) */
  htmlType?: 'submit' | 'reset' | 'button';
  /** Additional class names for the button */
  className?: string;
  /** Disabled state of the button */
  disabled?: boolean;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Button text */
  label?: string;
  /** Click event handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Variant of the button, which determines additional styles:
   * - "primary" adds the "button-primary" classes,
   * - "secondary" adds the "button-secondary" classes,
   * - "chat" adds the "button-chat" classes.
   */
  variant?: 'primary' | 'secondary' | 'chat';
  /** Disable border even when variant is set */
  noBorder?: boolean;
  /** Position of the icon relative to the label */
  iconPosition?: 'before' | 'after';
  /** data-testid attribute for testing */
  dataTestId?: string;
}

const Button: React.FC<ButtonProps> = ({
  htmlType = 'button',
  className,
  disabled = false,
  icon,
  label,
  onClick,
  variant,
  noBorder = false,
  iconPosition = 'before',
  dataTestId,
}) => {
  const baseClasses = classNames('button', { [`button-${variant}`]: variant }, className);

  const btnClass = twMerge(baseClasses, noBorder && 'border-0');

  return (
    <button type={htmlType} disabled={disabled} onClick={onClick} className={btnClass} data-testid={dataTestId}>
      {icon && iconPosition === 'before' && <span className={classNames({ 'mr-2': !!label })}>{icon}</span>}

      {label && <span>{label}</span>}

      {icon && iconPosition === 'after' && <span className={classNames({ 'ml-2': !!label })}>{icon}</span>}
    </button>
  );
};

export default Button;
