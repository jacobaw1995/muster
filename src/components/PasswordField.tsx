import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: "new-password" | "current-password";
  /** Shown as a small hint below the field — dim by default, danger-toned once `invalid` is true. */
  hint?: string;
  invalid?: boolean;
}

/** Shared password input with a show/hide toggle — used by Sign Up and Sign In. */
export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
  invalid,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-dim">
        {label}
      </span>
      <div className="relative flex items-center">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-input border border-line bg-card p-[13px] pr-11 font-sans text-[13px] font-semibold text-ink outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 flex-none border-none bg-transparent p-0 text-ink-dim"
        >
          {visible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      </div>
      {hint && (
        <span
          className={`font-sans text-[11px] font-medium ${invalid ? "text-danger" : "text-ink-dim"}`}
        >
          {hint}
        </span>
      )}
    </label>
  );
}
