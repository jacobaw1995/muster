interface SwitchProps {
  checked: boolean;
  onCheckedChange: () => void;
  ariaLabel?: string;
}

/** iOS-style toggle track. The knob is always white by design intent (see design_handoff), regardless of theme. */
export function Switch({ checked, onCheckedChange, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onCheckedChange}
      className={`relative h-6 w-[42px] flex-none rounded-pill transition-colors ${
        checked ? "bg-accent" : "bg-line"
      }`}
    >
      <span
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-[left]"
        style={{ left: checked ? 21 : 3 }}
      />
    </button>
  );
}
