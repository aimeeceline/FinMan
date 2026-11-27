import React from 'react';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onLabel?: string;
  offLabel?: string;
  ariaLabel?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  onLabel = 'ON',
  offLabel = 'OFF',
  ariaLabel = 'Bật/tắt',
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  // Dimensions configuration according to size
  const sizeConfig = {
    sm: {
      track: 'w-[68px] h-[30px]',
      knob: 'w-[24px] h-[24px] top-[3px] left-[3px]',
      knobTranslate: 'translate-x-[38px]',
      label: 'text-[10px] tracking-wider',
      onBox: 'left-0 w-[40px] pl-1.5',
      offBox: 'right-0 w-[40px] pr-1.5',
    },
    md: {
      track: 'w-[82px] h-[36px]',
      knob: 'w-[28px] h-[28px] top-[4px] left-[4px]',
      knobTranslate: 'translate-x-[46px]',
      label: 'text-xs tracking-wider',
      onBox: 'left-0 w-[48px] pl-1.5',
      offBox: 'right-0 w-[48px] pr-1.5',
    },
    lg: {
      track: 'w-[94px] h-[42px]',
      knob: 'w-[34px] h-[34px] top-[4px] left-[4px]',
      knobTranslate: 'translate-x-[52px]',
      label: 'text-sm tracking-wider',
      onBox: 'left-0 w-[54px] pl-2',
      offBox: 'right-0 w-[54px] pr-2',
    },
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full select-none transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] ${
        sizeConfig.track
      } ${
        checked
          ? 'bg-[#15803d] hover:bg-[#166534]'
          : 'bg-[#dc2626] hover:bg-[#b91c1c]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'} ${className}`}
    >
      <span className="sr-only">{ariaLabel}</span>

      {/* Label "ON" when checked */}
      <span
        aria-hidden="true"
        className={`absolute top-0 bottom-0 flex items-center justify-center font-black text-white ${
          sizeConfig.onBox
        } ${sizeConfig.label} transition-opacity duration-200 ${
          checked ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {onLabel}
      </span>

      {/* Label "OFF" when unchecked */}
      <span
        aria-hidden="true"
        className={`absolute top-0 bottom-0 flex items-center justify-center font-black text-white ${
          sizeConfig.offBox
        } ${sizeConfig.label} transition-opacity duration-200 ${
          !checked ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {offLabel}
      </span>

      {/* White circular knob (thumb) */}
      <span
        aria-hidden="true"
        className={`absolute rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-in-out pointer-events-none ${
          sizeConfig.knob
        } ${checked ? sizeConfig.knobTranslate : 'translate-x-0'}`}
      />
    </button>
  );
};

export default ToggleSwitch;
