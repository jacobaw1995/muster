import { useTheme } from "../theme/ThemeContext";
import { MoonIcon, SunIcon } from "./icons";

/** Shared dark/light toggle, used by both the mobile StatusBar and the desktop TopBar. */
export function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`flex cursor-pointer items-center border-none bg-transparent p-0.5 text-ink ${className}`}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
