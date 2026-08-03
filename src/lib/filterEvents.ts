import type { MusterEvent } from "./mockEvents";

export type DateFilter = "any" | "week" | "month" | "custom";
export const RADIUS_OPTIONS = [10, 25, 50, 100] as const;
export type RadiusMi = (typeof RADIUS_OPTIONS)[number];

export interface EventFilters {
  search: string;
  categories: string[];
  freeOnly: boolean;
  radiusMi: number;
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

export function filterEvents(
  events: MusterEvent[],
  filters: EventFilters,
): MusterEvent[] {
  const q = filters.search.trim().toLowerCase();
  const { start, end } = dateRangeFor(filters);

  return events.filter((ev) => {
    if (
      q &&
      !(
        ev.title.toLowerCase().includes(q) ||
        ev.organizer.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q)
      )
    )
      return false;
    if (filters.categories.length && !filters.categories.includes(ev.category))
      return false;
    if (filters.freeOnly && ev.cost !== "FREE") return false;
    if (ev.distanceMi > filters.radiusMi) return false;
    if (start && ev.date < start) return false;
    if (end && ev.date > end) return false;
    return true;
  });
}
