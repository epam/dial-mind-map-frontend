import classNames from 'classnames';
interface ToggleSwitchProps {
  id?: string;
  isOn: boolean;
  disabled?: boolean;
  handleSwitch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  switchOnText?: string | null;
  switchOFFText?: string | null;
}

interface SwitchStateTextProps {
  switchText: string;
  isOn: boolean;
}

const SwitchStateText = ({ switchText, isOn }: SwitchStateTextProps) => (
  <span className={classNames('h-[15px] w-6 text-xs', isOn && 'text-controls-permanent')}>{switchText}</span>
);

export function ToggleSwitch({
  id = 'toggle',
  isOn,
  switchOnText,
  switchOFFText,
  disabled,
  handleSwitch,
}: ToggleSwitchProps) {
  const switchText = isOn ? switchOnText : switchOFFText;
  const switchClassName = classNames(
    'flex min-w-[50px] shrink-0 items-center gap-1 rounded-full p-1.5 transition-all duration-200',
    isOn ? 'flex-row bg-accent-primary' : 'flex-row-reverse bg-layer-4',
    disabled ? 'opacity-50' : 'cursor-pointer',
  );

  return (
    <div className="relative">
      <input type="checkbox" onChange={handleSwitch} id={id} className="sr-only" checked={isOn} disabled={disabled} />
      <label htmlFor={id} className={switchClassName}>
        {switchText && <SwitchStateText switchText={switchText} isOn={isOn} />}
        <span className="size-3 rounded-full bg-controls-permanent"></span>
      </label>
    </div>
  );
}
