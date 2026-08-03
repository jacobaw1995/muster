import { eventDistanceMi, type Coords } from "./distance";
import type { MusterEvent } from "./mockEvents";

export type DateFilter = "any" | "week" | "month" | "custom";
/** `null` is "Any distance" — no radius filtering at all, regardless of whether a location is known. */
export const RADIUS_OPTIONS = [10, 25, 50, 100, null] as const;
export type RadiusMi = (typeof RADIUS_OPTIONS)[number];

export interface EventFilters {
  search: string;
  categories: string[];
  freeOnly: boolean;
  radiusMi: number | null;
  dateFilter: DateFilter;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: EventFilters = {
  search: "",
  categories: [],
  freeOnly: false,
  radiusMi: 25,
  dateFilter: "any",
  dateFrom: "",
  dateTo: "",
};

export function hasActiveFilters(filters: EventFilters): boolean {
  return (
    filters.categories.length > 0 ||
    filters.freeOnly ||
    filters.dateFilter !== "any"
  );
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateRangeFor(filters: EventFilters): {
  start: string | null;
  end: string | null;
} {
  if (filters.dateFilter === "custom") {
    return { start: filters.dateFrom || null, end: filters.dateTo || null };
  }
  if (filters.dateFilter === "week") {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    return { start: toISODate(now), end: toISODate(end) };
  }
  if (filters.dateFilter === "month") {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: toISODate(now), end: toISODate(end) };
  }
  return { start: null, end: null };
}

/**
 * `userLocation` is null until the user grants (or before they're asked
 * for) real geolocation — with no location, the radius filter can't mean
 * anything, so it's skipped entirely (every event passes on that axis) and
 * the existing date-ascending order from `listEvents` is kept. Once a
 * location is known, out-of-radius events are dropped and the rest are
 * sorted nearest-first; an event with no coordinates of its own (failed
 * geocode) still passes the radius check (nothing to compare) but sorts to
 * the end, since "unknown distance" isn't "zero distance".
 */
export function filterEvents(
  events: MusterEvent[],
  filters: EventFilters,
  userLocation: Coords | null,
): MusterEvent[] {
  const q = filters.search.trim().toLowerCase();
  const { start, end } = dateRangeFor(filters);

  const filtered = events.filter((ev) => {
    if (
      q &&
      !(
        ev.title.toLowerCase().includes(q) ||
        ev.organizer.toLowerCase().includes(q) ||
        (ev.location?.toLowerCase().includes(q) ?? false) ||
        (ev.city?.toLowerCase().includes(q) ?? false)
      )
    )
      return false;
    if (filters.categories.length && !filters.categories.includes(ev.category))
      return false;
    if (filters.freeOnly && ev.cost !== "FREE") return false;
    if (userLocation && filters.radiusMi != null) {
      const d = eventDistanceMi(userLocation, ev);
      if (d != null && d > filters.radiusMi) return false;
    }
    if (start && ev.date < start) return false;
    if (end && ev.date > end) return false;
    return true;
  });

  if (!userLocation) return filtered;

  return [...filtered].sort((a, b) => {
    const da = eventDistanceMi(userLocation, a) ?? Infinity;
    const db = eventDistanceMi(userLocation, b) ?? Infinity;
    return da - db;
  });
}
