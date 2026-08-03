import { useEffect, useState } from "react";
import { AccountButton } from "./AccountButton";
import { ThemeToggleButton } from "./ThemeToggleButton";

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

function formatTime(date: Date) {
  const hours = date.getHours() % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Mobile-only status-bar row: time, global theme toggle, account entry
 * point. Hidden at the desktop breakpoint (>=1024px), where TopBar takes
 * over both the primary nav and these same controls.
 */
export function StatusBar() {
  const time = useClock();

  return (
    <div className="flex flex-none items-center justify-between px-[22px] pb-1.5 pt-4 font-mono text-xs font-semibold text-ink lg:hidden">
      <span>{formatTime(time)}</span>
      <div className="flex items-center gap-2.5">
        <ThemeToggleButton />
        <AccountButton className="h-6 w-6" />
        <span aria-hidden className="tracking-widest">
          ●●●●
        </span>
      </div>
    </div>
  );
}
