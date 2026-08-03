/**
 * Category metadata and the core `MusterEvent` shape — real data comes from
 * Supabase (see lib/api/events.ts); despite the filename, no mock data lives
 * here anymore (removed once it went unused after Phase 3's real backend).
 */

export type CategoryKey =
  "ruck" | "cleanup" | "fitness" | "training" | "music" | "social";

export const CATEGORY_ORDER: CategoryKey[] = [
  "ruck",
  "cleanup",
  "fitness",
  "training",
  "music",
  "social",
];

export interface CategoryMeta {
  key: string;
  label: string;
  /** Raw CSS custom property (e.g. "--cat-ruck") for inline styles / SVG fills. */
  cssVar: string;
}

const KNOWN_CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  ruck: { key: "ruck", label: "RUCK", cssVar: "--cat-ruck" },
  cleanup: { key: "cleanup", label: "CLEANUP", cssVar: "--cat-cleanup" },
  fitness: { key: "fitness", label: "FITNESS", cssVar: "--cat-fitness" },
  training: { key: "training", label: "TRAINING", cssVar: "--cat-training" },
  music: { key: "music", label: "MUSIC", cssVar: "--cat-music" },
  social: { key: "social", label: "SOCIAL", cssVar: "--cat-social" },
};

const CUSTOM_CATEGORY_META: Omit<CategoryMeta, "key" | "label"> = {
  cssVar: "--cat-custom",
};

/** Any category string is accepted (Create lets members type a custom one); unknown keys fall back to the neutral custom dot. */
export function getCategoryMeta(category: string): CategoryMeta {
  const known = KNOWN_CATEGORY_META[category as CategoryKey];
  if (known) return known;
  return {
    key: category,
    label: category.toUpperCase(),
    ...CUSTOM_CATEGORY_META,
  };
}

export type RsvpStatus = "yes" | "maybe" | "no" | null;

export interface MusterEvent {
  id: string;
  title: string;
  category: CategoryKey | (string & {});
  organizer: string;
  /** Optional venue/label, e.g. "Basin Park trailhead" — city/state below are what's actually geocoded. */
  location: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  /** Geocoded at creation time (Phase 7) — null if geocoding failed, meaning no map pin and no real distance for this event yet. */
  latitude: number | null;
  longitude: number | null;
  /** ISO date, e.g. "2026-08-03". */
  date: string;
  /** Display-ready time, e.g. "5:30 AM". */
  time: string;
  durationLabel: string;
  /** "FREE" or a display-ready price like "$12". */
  cost: string;
  capacity: number | null;
  goingCount: number;
  maybeCount: number;
  attendees: string[];
  notes: string;
  website: string | null;
  photoUrl: string | null;
}

/** Going/maybe counts adjusted for the current user's own RSVP (mirrors the design file's withRsvp). */
export function withRsvpCounts(event: MusterEvent, status: RsvpStatus) {
  return {
    going: event.goingCount + (status === "yes" ? 1 : 0),
    maybe: event.maybeCount + (status === "maybe" ? 1 : 0),
  };
}

