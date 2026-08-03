import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon } from "./icons";

/** Shared close (X) button — same visual across Sign In, Sign Up, and Settings, just arranged differently per screen. */
export function CloseButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      aria-label="Close"
      className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line bg-card text-ink ${className}`}
    >
      <XIcon size={15} />
    </button>
  );
}

/**
 * Shared scroll/padding scaffold for the auth/settings screens (Sign In,
 * Sign Up, Settings) — reached only via the status-bar account button, not
 * a nav tab. Each screen composes its own header as its first child (Sign
 * In/Up: a standalone <CloseButton/>; Settings: a centered title row with
 * <CloseButton/> on the left) since the two header shapes genuinely differ.
 */
export function ModalShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-1 flex-col gap-[18px] overflow-y-auto px-screen py-4">
      {children}
    </div>
  );
}
