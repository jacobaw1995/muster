/**
 * Mock event data for Phase 1a. No backend yet — this is the full data
 * surface Map and Event Detail render against. Shapes mirror what a real
 * events API would plausibly return so swapping in Supabase later is a
 * data-source change, not a screen rewrite.
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
  location: string;
  distanceMi: number;
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
  /** Map pin position as a percentage of the map panel, 0-100. */
  x: number;
  y: number;
}

/** Going/maybe counts adjusted for the current user's own RSVP (mirrors the design file's withRsvp). */
export function withRsvpCounts(event: MusterEvent, status: RsvpStatus) {
  return {
    going: event.goingCount + (status === "yes" ? 1 : 0),
    maybe: event.maybeCount + (status === "maybe" ? 1 : 0),
  };
}

// Pre-sorted soonest-first — screens rely on this order rather than re-sorting.
export const MOCK_EVENTS: MusterEvent[] = [
  {
    id: "e1",
    title: "Sunrise Ruck: Basin Loop",
    category: "ruck",
    organizer: "Iron Ruck Co.",
    location: "Basin Reservoir Trailhead",
    distanceMi: 1.2,
    date: "2026-08-03",
    time: "5:30 AM",
    durationLabel: "2 hours",
    cost: "FREE",
    capacity: 40,
    goingCount: 22,
    maybeCount: 6,
    attendees: ["Marcus T.", "Dana K.", "Wyatt R.", "Priya S."],
    notes:
      "6 miles, ruck weight optional. We regroup every 2 miles. Coffee after at the trailhead lot.",
    website: null,
    photoUrl: null,
    x: 24,
    y: 22,
  },
  {
    id: "e2",
    title: "Founders Green Cleanup",
    category: "cleanup",
    organizer: "Basin Cleanup Crew",
    location: "Founders Green",
    distanceMi: 2.8,
    date: "2026-08-06",
    time: "8:00 AM",
    durationLabel: "3 hours",
    cost: "FREE",
    capacity: 60,
    goingCount: 38,
    maybeCount: 9,
    attendees: ["Leah M.", "Tomas V.", "Grace O.", "Kenji H."],
    notes:
      "Gloves and bags provided. Bring your own water bottle — we're cutting single-use plastic from the event itself.",
    website: null,
    photoUrl: null,
    x: 68,
    y: 64,
  },
  {
    id: "e3",
    title: "Ironclad Strength Session",
    category: "fitness",
    organizer: "Steel Line Fitness",
    location: "Ironclad CrossFit",
    distanceMi: 0.6,
    date: "2026-08-08",
    time: "6:00 AM",
    durationLabel: "1 hour",
    cost: "$10",
    capacity: 25,
    goingCount: 14,
    maybeCount: 4,
    attendees: ["Andre B.", "Sam L."],
    notes:
      "Scaled options for every movement. First-timers welcome — introduce yourself at the door.",
    website: null,
    photoUrl: null,
    x: 40,
    y: 40,
  },
  {
    id: "e4",
    title: "Land Nav Fundamentals",
    category: "training",
    organizer: "Overwatch Training Group",
    location: "Ridgeline Park",
    distanceMi: 4.1,
    date: "2026-08-12",
    time: "9:00 AM",
    durationLabel: "6 hours",
    cost: "$15",
    capacity: 20,
    goingCount: 9,
    maybeCount: 5,
    attendees: ["Julia F.", "Marcus T."],
    notes:
      "Bring a compass if you own one — loaners available. Covers map reading, pace counting, and route planning.",
    website: "https://overwatchtraining.example.com/land-nav",
    photoUrl: null,
    x: 78,
    y: 28,
  },
  {
    id: "e5",
    title: "Porchlight Sessions: Live Acoustic",
    category: "music",
    organizer: "The Armory Hall",
    location: "The Armory Hall",
    distanceMi: 3.4,
    date: "2026-08-15",
    time: "7:00 PM",
    durationLabel: "4 hours",
    cost: "$12",
    capacity: 150,
    goingCount: 96,
    maybeCount: 20,
    attendees: ["Renee C.", "Big Mike", "Ashley P.", "Dev N."],
    notes:
      "Doors at 6:30. All-ages, cash bar 21+. Local openers, then the headline set.",
    website: "https://thearmoryhall.example.com/events/porchlight-sessions",
    photoUrl: null,
    x: 55,
    y: 78,
  },
  {
    id: "e6",
    title: "Members Social & Cookout",
    category: "social",
    organizer: "Operator Standard Community",
    location: "Overwatch Brewing Co.",
    distanceMi: 1.9,
    date: "2026-08-20",
    time: "5:00 PM",
    durationLabel: "4 hours",
    cost: "FREE",
    capacity: null,
    goingCount: 51,
    maybeCount: 14,
    attendees: ["Hannah G.", "DJ R.", "Faith W."],
    notes:
      "Bring a dish if you can. Kids and dogs welcome — this one's low-key.",
    website: null,
    photoUrl: null,
    x: 20,
    y: 60,
  },
  {
    id: "e7",
    title: "Night Ruck: 10-Miler",
    category: "ruck",
    organizer: "Iron Ruck Co.",
    location: "Basin Reservoir Trailhead",
    distanceMi: 1.2,
    date: "2026-08-22",
    time: "9:00 PM",
    durationLabel: "All day",
    cost: "FREE",
    capacity: 30,
    goingCount: 18,
    maybeCount: 3,
    attendees: ["Wyatt R.", "Priya S."],
    notes:
      "Headlamps required. This one's a grind — pace yourself, we don't leave anyone behind.",
    website: null,
    photoUrl: null,
    x: 85,
    y: 50,
  },
  {
    id: "e8",
    title: "Trailhead Yoga & Mobility",
    category: "fitness",
    organizer: "Steel Line Fitness",
    location: "Ridgeline Park",
    distanceMi: 3.9,
    date: "2026-08-09",
    time: "7:00 AM",
    durationLabel: "1 hour",
    cost: "FREE",
    capacity: 35,
    goingCount: 11,
    maybeCount: 2,
    attendees: ["Priya S.", "Grace O."],
    notes:
      "Mats not provided — bring your own. Beginner-friendly, focused on hip and shoulder mobility for ruckers.",
    website: null,
    photoUrl: null,
    x: 72,
    y: 34,
  },
  {
    id: "e9",
    title: "Overwatch Airsoft Skirmish",
    category: "skirmish",
    organizer: "Overwatch Training Group",
    location: "Basin County Fields",
    distanceMi: 15.5,
    date: "2026-08-14",
    time: "10:00 AM",
    durationLabel: "6 hours",
    cost: "$25",
    capacity: 48,
    goingCount: 31,
    maybeCount: 7,
    attendees: ["Julia F.", "Andre B.", "Dev N."],
    notes:
      "Full gear required, rentals available on-site. A custom category — not one of the six built-ins.",
    website: null,
    photoUrl: null,
    x: 10,
    y: 82,
  },
  {
    id: "e10",
    title: "Basin County Cleanup: River Bend",
    category: "cleanup",
    organizer: "Basin Cleanup Crew",
    location: "River Bend Access",
    distanceMi: 42,
    date: "2026-08-29",
    time: "8:30 AM",
    durationLabel: "3 hours",
    cost: "FREE",
    capacity: 45,
    goingCount: 12,
    maybeCount: 3,
    attendees: ["Leah M.", "Kenji H."],
    notes:
      "Waders recommended but not required. This stretch collects a lot of debris after storms.",
    website: null,
    photoUrl: null,
    x: 92,
    y: 12,
  },
];
