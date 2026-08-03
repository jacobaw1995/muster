import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { FilterSheet } from "../components/FilterSheet";
import { FilterIcon, SearchIcon } from "../components/icons";
import { MapPanel, type MapDemoState } from "../components/MapPanel";
import { PhotoSlot } from "../components/PhotoSlot";
import { eventDistanceMi } from "../lib/distance";
import { RADIUS_OPTIONS, filterEvents, hasActiveFilters } from "../lib/filterEvents";
import { fmtDateLabel, fmtDistance, fmtVenueLine } from "../lib/format";
import {
  getCategoryMeta,
  withRsvpCounts,
  type MusterEvent,
} from "../lib/mockEvents";
import { useSession } from "../state/SessionContext";

/**
 * Prototype-only affordance for reviewing the 4 designed data states (see
 * design_handoff_muster_events_app/README.md, Screen 1, plus the Phase 4
 * error state). Real data already drives loading/empty/error automatically
 * — this segmented row is purely a design-review tool and must not ship.
 * Gated on Vite's DEV flag so it's present under `npm run dev` but
 * completely absent (dead-code-eliminated) from `npm run build` output.
 */
const DEV_STATE_SWITCHER = import.meta.env.DEV;

function EventListRow({
  event,
  distanceMi,
  goingLabel,
  onOpen,
}: {
  event: MusterEvent;
  distanceMi: number | null;
  goingLabel: string;
  onOpen: () => void;
}) {
  const meta = getCategoryMeta(event.category);
  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer gap-3 rounded-card border border-line bg-card p-3"
    >
      <div className="relative h-16 w-16 flex-none overflow-hidden rounded-[10px]">
        <PhotoSlot photoUrl={event.photoUrl} className="h-16 w-16" />
        <span
          className="absolute bottom-1 right-1 h-[9px] w-[9px] rounded-full"
          style={{
            background: `var(${meta.cssVar})`,
            boxShadow: "0 0 0 2px var(--bg)",
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono text-[9.5px] font-bold tracking-[0.08em]"
            style={{ color: `var(${meta.cssVar})` }}
          >
            {meta.label}
          </span>
          <span className="font-mono text-[9.5px] font-semibold text-ink-dim">
            · {fmtDistance(distanceMi)}
          </span>
        </div>
        <div className="truncate font-sans text-sm font-bold text-ink">
          {event.title}
        </div>
        <div className="truncate font-sans text-[11px] font-medium text-ink-dim">
          {fmtDateLabel(event.date)} · {event.time} · {fmtVenueLine(event)}
        </div>
        <div className="mt-px flex items-center gap-2">
          <span className="font-mono text-[10.5px] font-bold text-ink">
            {event.cost}
          </span>
          <span className="font-sans text-[10.5px] font-semibold text-ink-dim">
            {goingLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

interface MapScreenProps {
  /**
   * Desktop-only: renders just the fill map, no rail/header/list. Used by
   * AppShell for the persistent background map behind the Event Detail /
   * Create right-side panel — that map already gets its own full
   * rail+fill-map treatment when it's the actual "/" route, so reusing the
   * default render there would nest a second rail inside the remaining
   * space and squeeze/collapse the map. Ignored below the desktop
   * breakpoint (no panel route exists on mobile to trigger this).
   */
  mapOnly?: boolean;
}

export default function MapScreen({ mapOnly = false }: MapScreenProps = {}) {
  const navigate = useNavigate();
  const {
    events,
    filters,
    setSearch,
    setRadius,
    rsvp,
    loading,
    loadError,
    retryLoad,
    userLocation,
    locationStatus,
    requestLocation,
  } = useSession();
  const [demoState, setDemoState] = useState<MapDemoState>("live");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredEvents = useMemo(
    () => filterEvents(events, filters, userLocation),
    [events, filters, userLocation],
  );

  const openDetail = (id: string) => {
    navigate(`/events/${id}`, { state: { from: "map" } });
  };

  const cycleRadius = () => {
    const i = RADIUS_OPTIONS.findIndex((mi) => mi === filters.radiusMi);
    setRadius(RADIUS_OPTIONS[(i + 1) % RADIUS_OPTIONS.length]);
  };

  // The dev switcher can still force loading/empty/error for design review;
  // the default "live" state defers to the real fetch driven by
  // SessionContext (error takes precedence over loading — once a load has
  // failed we're no longer "in flight").
  const effectiveState: MapDemoState =
    demoState === "live" && loadError
      ? "error"
      : demoState === "live" && loading
        ? "loading"
        : demoState;
  const zeroResults = effectiveState === "live" && filteredEvents.length === 0;

  const mapPanelProps = {
    demoState: effectiveState,
    events: filteredEvents,
    radiusMi: filters.radiusMi,
    onCycleRadius: cycleRadius,
    userLocation,
    locationStatus,
    onRequestLocation: requestLocation,
    onSelectEvent: openDetail,
  };

  if (mapOnly) {
    return (
      <MapPanel
        {...mapPanelProps}
        className="lg:mx-0 lg:mb-0 lg:h-full lg:flex-1 lg:rounded-none lg:border-0"
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
      {/* Desktop (>=1024px): left rail — search/filters/list, scrolls as one unit. Below that breakpoint this is just the normal single-column page. */}
      <div className="flex min-h-0 flex-none flex-col lg:w-[420px] lg:flex-none lg:overflow-y-auto lg:border-r lg:border-line">
      <div className="flex flex-none flex-col gap-2.5 px-screen pb-3 pt-1.5">
        <div className="flex items-baseline justify-between lg:hidden">
          <div className="font-display text-2xl tracking-[0.02em] text-ink">
            MUSTER
          </div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.12em] text-accent">
            {filteredEvents.length} EVENTS
          </div>
        </div>
        <div className="hidden font-mono text-[10px] font-semibold tracking-[0.12em] text-accent lg:block">
          {filteredEvents.length} EVENTS
        </div>

        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-input border border-line bg-card px-[13px] py-[11px]">
            <SearchIcon className="text-ink-dim" />
            <input
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, orgs, spots"
              className="w-full border-none bg-transparent font-sans text-[13px] font-medium text-ink outline-none placeholder:text-ink-dim"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label="Open filters"
            className="relative flex h-[42px] w-[42px] flex-none items-center justify-center rounded-input border border-line bg-card"
          >
            <FilterIcon className="text-ink" />
            {hasActiveFilters(filters) && (
              <span className="absolute -right-[3px] -top-[3px] h-[9px] w-[9px] rounded-full border-2 border-bg bg-signal" />
            )}
          </button>
        </div>

        {DEV_STATE_SWITCHER && (
          <div className="flex gap-1.5" aria-hidden>
            {(
              [
                { key: "live", label: "LIVE" },
                { key: "loading", label: "LOADING" },
                { key: "empty", label: "NO EVENTS" },
                { key: "error", label: "ERROR" },
              ] as const
            ).map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDemoState(d.key)}
                className={`flex-1 rounded-lg border border-line p-1.5 font-mono text-[9.5px] font-semibold tracking-[0.06em] ${
                  demoState === d.key
                    ? "bg-accent text-accent-on"
                    : "bg-card text-ink-dim"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: inline map between the header and the list. Hidden on desktop, where the map moves to the fill pane below instead. */}
      <MapPanel {...mapPanelProps} className="lg:hidden" />

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-[14px] pb-[90px] lg:flex-none lg:overflow-visible lg:pb-5">
        <div className="px-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-ink-dim">
          UPCOMING NEAR YOU
        </div>

        {effectiveState === "loading" && (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[92px] animate-[pulse_1.4s_ease-in-out_infinite] rounded-card border border-line bg-card"
              />
            ))}
          </div>
        )}

        {effectiveState === "empty" && (
          <div className="flex flex-col items-center gap-3 px-2.5 py-[30px] text-center">
            <div className="font-sans text-xs font-medium text-ink-dim">
              Start something. Rally the community around it.
            </div>
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="rounded-[10px] border-none bg-signal px-[22px] py-3 font-sans text-[12.5px] font-bold tracking-[0.03em] text-signal-on"
            >
              POST AN EVENT
            </button>
          </div>
        )}

        {effectiveState === "error" && (
          <ErrorState
            message="Couldn't load events. Check your connection."
            onRetry={retryLoad}
          />
        )}

        {effectiveState === "live" && (
          <>
            {filteredEvents.map((ev) => {
              const counts = withRsvpCounts(ev, rsvp[ev.id] ?? null);
              return (
                <EventListRow
                  key={ev.id}
                  event={ev}
                  distanceMi={eventDistanceMi(userLocation, ev)}
                  goingLabel={`${counts.going} going`}
                  onOpen={() => openDetail(ev.id)}
                />
              );
            })}
            {zeroResults && (
              <div className="px-2.5 py-6 text-center font-sans text-xs font-medium text-ink-dim">
                {filters.search
                  ? `No matches for "${filters.search}". Try clearing filters.`
                  : userLocation
                    ? "No events match your filters. Try widening your radius or clearing filters."
                    : "No events match your filters. Try clearing filters."}
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Desktop: large map filling the rest of the viewport beside the rail. */}
      <MapPanel
        {...mapPanelProps}
        className="hidden lg:mx-0 lg:mb-0 lg:block lg:h-full lg:flex-1 lg:rounded-none lg:border-0"
      />

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        resultCount={filteredEvents.length}
      />
    </div>
  );
}
