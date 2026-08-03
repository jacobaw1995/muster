import { NavLink } from "react-router-dom";
import { BarChartIcon, ListIcon, MapPinIcon, PlusIcon } from "./icons";

const tabClasses =
  "flex flex-none flex-col items-center gap-[3px] bg-transparent border-none no-underline";
const labelClasses = "font-sans text-[9.5px] font-bold tracking-[0.03em]";

function tabColor(isActive: boolean) {
  return isActive ? "text-accent" : "text-ink-dim";
}

interface BottomNavProps {
  /** Number of items currently planned in the Itinerary; badge hides at 0. */
  itineraryCount?: number;
}

/** Persistent bottom tab bar — Map / Create (elevated FAB) / Impact / Itinerary. */
export function BottomNav({ itineraryCount = 0 }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="absolute inset-x-0 bottom-0 flex flex-none items-center justify-around border-t border-line bg-bg px-2 pt-2.5 lg:hidden"
      style={{ paddingBottom: "calc(22px + env(safe-area-inset-bottom))" }}
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) => `${tabClasses} ${tabColor(isActive)}`}
      >
        <MapPinIcon />
        <span className={labelClasses}>MAP</span>
      </NavLink>

      <NavLink
        to="/create"
        aria-label="Create event"
        className={({ isActive }) => `${tabClasses} ${tabColor(isActive)}`}
      >
        <span className="-mt-4 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-signal shadow-[0_6px_14px_rgba(255,106,43,0.45)]">
          <PlusIcon size={18} className="text-signal-on" />
        </span>
        <span className={labelClasses}>CREATE</span>
      </NavLink>

      <NavLink
        to="/impact"
        className={({ isActive }) => `${tabClasses} ${tabColor(isActive)}`}
      >
        <BarChartIcon />
        <span className={labelClasses}>IMPACT</span>
      </NavLink>

      <NavLink
        to="/itinerary"
        className={({ isActive }) =>
          `${tabClasses} relative ${tabColor(isActive)}`
        }
      >
        <ListIcon />
        <span className={labelClasses}>ITINERARY</span>
        {itineraryCount > 0 && (
          <span className="absolute -right-0.5 -top-1 min-w-[14px] rounded-full bg-signal px-[5px] py-px text-center font-mono text-[9px] font-bold text-white">
            {itineraryCount}
          </span>
        )}
      </NavLink>
    </nav>
  );
}
