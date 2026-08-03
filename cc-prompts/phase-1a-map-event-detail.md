# MUSTER — Phase 1a: Home/Map + Event Detail (mock data)

Phase 0 (scaffold, tokens, themed shell, nav, 8 stub routes) is complete and approved. This is **Phase 1a**. Build the two most important screens — **Home/Map** and **Event Detail** — pixel-accurate against MOCK data. No backend, no auth logic yet (later phases). Reuse the Phase 0 tokens, theme system, phone shell, and bottom nav — do not restyle them.

## Reference

- Spec: `design_handoff_muster_events_app/README.md` — read **Screen 1 (Home/Map)** and **Screen 2 (Event Detail)** in full, plus "Navigation", "Interactions & Behavior Summary", and "Empty/Loading/Error States".
- Visual truth: `design_handoff_muster_events_app/Muster - Operator Standard Events.dc.html` (open in browser). Spec only — never copy its proprietary runtime.
- Every color/spacing value must come from the existing Phase 0 tokens (`bg-card`, `text-ink`, `bg-accent`, `text-signal`, `bg-cat-ruck`, etc.). Zero hardcoded hex in components.

## Mock data (build this first)

Create `src/lib/mockEvents.ts` exporting a typed `Event[]` (8–12 events) and the TS types. Each event:

- `id` (string, used in `/events/:id`), `title`, `category` (one of ruck/cleanup/fitness/training/music/social, or a custom string), `organizer` (org name), `location` (text), `distanceMi` (number), `date` (ISO), `time` (display string), `durationLabel` (e.g. "2 hours" / "All day"), `cost` (`"FREE"` or `"$N"`), `capacity` (number|null), `goingCount`, `maybeCount`, `attendees` (string[] of names), `notes` (organizer notes text), `website` (string|null — external ticket/host URL), `photoUrl` (null for now — render placeholder drop-zone styling), and map coords `x`/`y` as percentages (0–100) for pin placement.
  Include at least one event with a `website` set and one without, a mix of FREE and paid, and varied categories.

Also add a light client state store (React context or Zustand-free simple context) for session state that later screens share: current RSVP per event (`yes|maybe|no|null`), itinerary list (event ids), active filters, and radius. Keep it in-memory this phase (persist to localStorage is fine but not required).

## Screen 1 — Home/Map

Top to bottom, matching the spec:

- **Header row:** "MUSTER" wordmark (Anton) + live "N EVENTS" count (mono), reflecting the currently filtered list.
- **Search bar:** magnifying-glass icon + input, placeholder "Search events, orgs, spots" + a filter icon button that opens the filter sheet; filter button shows a small orange dot badge when any filter is active. Search matches against title, organizer, AND location text.
- **Dev-only state switcher row:** 3 segmented buttons **LIVE / LOADING / NO EVENTS** that force which of the 3 states renders. Clearly mark this as prototype-only (a comment + a `DEV_STATE_SWITCHER` flag) — it must be trivially removable and should not imply production behavior. In real use the screen reflects data automatically.
- **Map panel** (~280px tall, rounded, bordered) styled like a flat Google/Apple map using the `map*` tokens: basemap fill, a water shape bottom-right, a park/green blob, thin minor-road grid, 2 thicker arterial roads, small rotated street labels + a neighborhood label + a county/city label top-left. All CSS/SVG — no real map library.
  - Category-colored teardrop **pins** placed by each event's `x`/`y` percent; tapping a pin opens that event's Detail.
  - **"Near Me"** circular button bottom-right — toggles a centered-on-me visual state (icon fill changes).
  - **Radius pill** bottom-left (e.g. "25 MI RADIUS ▾") — tappable, cycles 10/25/50/100 mi and actually filters list + pins by `distanceMi`. Same state as the filter sheet's radius picker.
- **Event list** below map, header "UPCOMING NEAR YOU". Each row: 64×64 photo thumbnail (placeholder drop-zone; category-color dot badge bottom-right of thumb) — category label (mono, category color) + distance — title (bold) — date/time + truncated location — cost badge (FREE/$N) + "{N} going". Tapping a row opens Detail (and updates the URL to `/events/:id`).
- **Three states** (driven by the dev switcher but represent real states to handle):
  - **Live:** pins + list populated.
  - **Loading:** map shows spinner + "LOCATING EVENTS…"; list shows 3 pulsing skeleton rows.
  - **Empty:** map shows icon + "Nothing happening nearby" + "No events within 25 mi. Widen your radius or be the first to post one."; list shows "Start something. Rally the community around it." + a "POST AN EVENT" CTA → `/create`.
- **Zero-results (filtered):** when filters/search yield nothing, show "No matches for "{query}". Try clearing filters." in place of the list.

**Filter bottom sheet** (slides up, scrim behind; tap scrim or close to dismiss):

- Category multi-select chips (all 6, dot + label, toggle, active = colored border/fill).
- "WHEN": presets Any time / This week / This month / Pick dates. "Pick dates" reveals From/To date inputs (custom range).
- "SEARCH RADIUS": 10/25/50/100 mi picker (shared state with the map radius pill).
- "Free events only" toggle.
- "CLEAR" (resets all) + primary "SHOW {N} EVENTS" that closes the sheet.

## Screen 2 — Event Detail (`/events/:id`)

- **Hero photo** 150px tall full-width (placeholder drop-zone). Floating circular translucent **back** button (top-left) and **share** button (top-right).
- Category pill badge (colored) + title (Anton) + "Hosted by {org}".
- **Info card:** date row (calendar icon + date + "{time} · {duration}"), location row (pin icon + location + distance), cost/capacity row (clock icon + cost badge, people icon + "{going}/{capacity} CAP").
- **"ORGANIZER NOTES"** section — free text from `notes`.
- **Host website link (conditional):** only when `website` is set, show an outlined "VISIT HOST WEBSITE & TICKETS ↗" button under notes that opens the URL in a new tab. Hidden entirely otherwise.
- **"ARE YOU IN?"** RSVP segmented control **YES / MAYBE / NO** — each togglable (tapping the active one clears your RSVP). Live counts above ("{n} going · {n} maybe"), plus a row of attendee name chips (first 4 names + "+N more"). **Tapping YES also auto-adds the event to the itinerary** (if not already) and fires a toast "Added to itinerary". Un-RSVP'ing (tapping YES again) does NOT remove it from the itinerary.
- **Bottom actions:** "ADD TO ITINERARY" / "IN YOUR ITINERARY" primary toggle button (checkmark + color swap when added; this is the manual path, independent of RSVP auto-add) + a secondary share icon button.
- **Share bottom sheet:** small social-preview card (photo thumb + title + the shareable URL) + "COPY LINK" and "TEXT A FRIEND" actions. Copy fires a toast.
- **Deep link:** opening `/events/:id` directly lands straight on that event's Detail.
- **Back behavior:** back button returns to wherever Detail was opened from — Map (default) or Itinerary. Track origin and pop back to it.

## Shared UI to build this phase (reusable)

- **Bottom sheet** component (scrim + slide-up, dismiss on scrim/close) — used by filter and share now, reused later.
- **Toast** — small pill, bottom-center, auto-dismiss ~2.2s.
- Extend the inline SVG icon set as needed (search, filter, calendar, pin, clock, people, share, back-chevron, near-me, checkmark).

## Constraints

- Mock data only; all interactions are in-memory/session state.
- Strictly token-based styling; nothing hardcoded.
- Don't touch `design_handoff_muster_events_app/`.
- Keep `npm run build` and `npm run lint` clean.

## Definition of done

- Map renders all 3 states (via the dev switcher), pins + list reflect radius/filter/search, filter sheet works, zero-results state works.
- Tapping a pin or list row opens the correct Event Detail via `/events/:id`; direct-URL deep link works; back returns to origin.
- Event Detail RSVP toggles + counts, auto-add-to-itinerary on YES (with toast), manual add/remove toggle, conditional host-website link, and share sheet with working copy-link all function.
- Dark/light toggle still repaints both screens correctly.
- Build + lint clean.

When done, summarize what you built, note anything you deviated on or left as TODO, and confirm the definition-of-done checklist for review before Phase 1b (Create wizard).
