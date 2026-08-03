import { NavLink } from "react-router-dom";
import { AccountButton } from "./AccountButton";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { Wordmark } from "./Wordmark";
import { BarChartIcon, ListIcon, MapPinIcon, PlusIcon } from "./icons";

const navItemClasses =
  "flex items-center gap-1.5 border-none bg-transparent no-underline font-sans text-[13px] font-bold tracking-[0.02em]";

function navColor(isActive: boolean) {
  return isActive ? "text-accent" : "text-ink-dim";
}

interface TopBarProps {
  /** Number of items currently planned in the Itinerary; badge hides at 0. */
  itineraryCount?: number;
}

/**
 * Desktop-only (>=1024px) replacement for the mobile StatusBar + BottomNav
 * combo: the same 4 destinations plus the wordmark on the left, and the
 * same theme/account controls on the right. Hidden below the breakpoint.
 */
export function TopBar({ itineraryCount = 0 }: TopBarProps) {
  return (
    <div className="hidden flex-none items-center justify-between border-b border-line bg-bg px-8 py-3.5 lg:flex">
      <div className="flex items-center gap-10">
        <Wordmark height={24} />
        <nav aria-label="Primary" className="flex items-center gap-7">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${navItemClasses} ${navColor(isActive)}`}
          >
            <MapPinIcon size={16} />
            MAP
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) => `${navItemClasses} ${navColor(isActive)}`}
          >
            <PlusIcon size={16} />
            CREATE
          </NavLink>
          <NavLink
            to="/impact"
            className={({ isActive }) => `${navItemClasses} ${navColor(isActive)}`}
          >
            <BarChartIcon size={16} />
            IMPACT
          </NavLink>
          <NavLink
            to="/itinerary"
            className={({ isActive }) =>
              `${navItemClasses} relative ${navColor(isActive)}`
            }
          >
            <ListIcon size={16} />
            ITINERARY
            {itineraryCount > 0 && (
              <span className="absolute -right-3 -top-2 min-w-[15px] rounded-full bg-signal px-[5px] py-px text-center font-mono text-[9px] font-bold text-white">
                {itineraryCount}
              </span>
            )}
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-3.5">
        <ThemeToggleButton />
        <AccountButton className="h-8 w-8" />
      </div>
    </div>
  );
}
