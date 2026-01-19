import classNames from 'classnames';

interface ReactionButtonProps {
  ariaLabel: string;
  onClick: () => void;
  active: boolean;
  className: string;
  children: React.ReactNode;
}

export const ReactionButton = ({ ariaLabel, onClick, active, className, children }: ReactionButtonProps) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    className={classNames(
      'reactions__button flex items-center justify-center size-6 rounded-md transition-colors',
      active ? 'reactions__button--active text-accent-primary' : 'text-secondary hover:text-accent-primary',
      className,
    )}
  >
    {children}
  </button>
);
