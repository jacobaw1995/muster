import { Outlet, useLocation } from "react-router-dom";
import MapScreen from "../routes/MapScreen";
import { useSession } from "../state/SessionContext";
import { ToastHost } from "../state/ToastContext";
import { BottomNav } from "./BottomNav";
import { PhoneFrame } from "./PhoneFrame";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";

const PANEL_ROUTE_PATTERN = /^\/(create|events\/[^/]+)$/;

/**
 * Layout for the 4 primary tab destinations (+ Event Detail). Each screen
 * owns its own scroll behavior (Map splits fixed header/map from a
 * scrolling list; Detail scrolls as one region) — this wrapper only
 * constrains height, it doesn't impose overflow itself.
 *
 * Desktop (>=1024px): Create and Event Detail render as a right-side panel
 * over a persistent Map, per the design spec's documented desktop
 * adaptation. Rather than forking the route tree, this renders a second,
 * always-live MapScreen instance directly (imported from routes/ — an
 * intentional exception to the usual routes-depend-on-components direction)
 * behind the panel; MapScreen's own data comes from SessionContext, so
 * there's no extra fetch, just a fresh instance of its (session-scoped)
 * local UI state. Below the breakpoint this block is inert — only the
 * normal <Outlet/> renders, exactly as before.
 */
export function AppShell() {
  const { itinerary } = useSession();
  const location = useLocation();
  const isPanelRoute = PANEL_ROUTE_PATTERN.test(location.pathname);

  return (
    <PhoneFrame>
      <StatusBar />
      <TopBar itineraryCount={itinerary.length} />
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {isPanelRoute && (
          <div className="hidden min-h-0 flex-1 lg:block">
            <MapScreen mapOnly />
          </div>
        )}
        <div
          className={`relative flex min-h-0 flex-1 flex-col ${
            isPanelRoute ? "lg:w-[420px] lg:flex-none lg:border-l lg:border-line" : ""
          }`}
        >
          <Outlet />
        </div>
      </div>
      <BottomNav itineraryCount={itinerary.length} />
      <ToastHost />
    </PhoneFrame>
  );
}
