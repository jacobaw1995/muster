import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const TOAST_DURATION_MS = 2200;

interface ToastContextValue {
  message: string | null;
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Holds toast state only — no UI. Mount this high (main.tsx) so any screen
 * can call showToast(). The actual pill is rendered by <ToastHost/>, which
 * must be placed inside the phone-frame's relative screen container (see
 * AppShell) so its `absolute` positioning anchors to the screen, not the
 * browser viewport.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((next: string) => {
    window.clearTimeout(timeoutRef.current);
    setMessage(next);
    timeoutRef.current = window.setTimeout(
      () => setMessage(null),
      TOAST_DURATION_MS,
    );
  }, []);

  const value = useMemo(() => ({ message, showToast }), [message, showToast]);

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast(): { showToast: (message: string) => void } {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

/** Renders the current toast pill, if any. Mount inside the phone screen. */
export function ToastHost() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastHost must be used within a ToastProvider");
  if (!ctx.message) return null;

  return (
    <div
      role="status"
      className="absolute bottom-24 left-1/2 z-50 -translate-x-1/2 animate-[toast-in_0.25s_ease] whitespace-nowrap rounded-pill bg-ink px-[18px] py-[11px] font-sans text-xs font-bold text-bg shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
    >
      {ctx.message}
    </div>
  );
}
