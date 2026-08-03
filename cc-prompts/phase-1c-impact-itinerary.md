# MUSTER — Phase 1c: Impact Dashboard + Itinerary Builder (mock data)

Phases 0, 1a, 1b are complete and approved. This is **Phase 1c**. Build **Screen 4 (Impact Dashboard, `/impact`)** and **Screen 5 (Itinerary Builder, `/itinerary`)**, pixel-accurate against the spec, wired to the existing in-memory session state. No backend/auth. Reuse Phase 0/1a/1b tokens, components (BottomSheet, Toast, Switch), the `MusterEvent` type, and existing session state — do not restyle or fork.

## Reference

- Spec: `design_handoff_muster_events_app/README.md` — read **Screen 4 (Impact Dashboard)** and **Screen 5 (Itinerary Builder)** in full, plus "Interactions & Behavior Summary".
- Visual truth: `design_handoff_muster_events_app/Muster - Operator Standard Events.dc.html`. Spec only — never copy its runtime.
- Token-only styling; zero hardcoded hex.

## Session state additions

- Personal impact running totals: `bagsOfTrash`, `milesRucked`, `peopleHelped`, `eventsShowedUp` (seed with reasonable non-zero starting numbers so the count-up is visible).
- A `loggedFor` list: entries of `{ eventId, eventTitle, summary }` (e.g. summary "3 bags · 5.5 mi").
- `logImpact(eventId, { bags, miles, people })` — adds amounts to totals, increments `eventsShowedUp` by 1, appends a `loggedFor` row, and triggers the count-up re-animation.
- **Bring back `removeFromItinerary(eventId)`** (trimmed in 1a) — needed for the Itinerary per-row remove button.
- Org-wide aggregate numbers can be static mock constants (2026 vs all-time sets) — the spec says this view is not user-editable.

## Screen 4 — Impact Dashboard (`/impact`)

- Header "IMPACT" (Anton). On the **Personal tab only**, a "+ LOG IMPACT" button top-right.
- Segmented control: **YOU** / **OPERATOR STANDARD**.
- **Personal ("YOU"):**
  - "Your running totals — all-time" label.
  - 2×2 stat grid — **Bags of Trash / Miles Rucked / People Helped / Events Showed Up For** — large mono numbers (24–44px) with a **count-up animation** on entry and on tab-switch back to this view.
  - A highlighted "THIS MONTH" summary card with a short motivating sentence.
  - A "LOGGED FOR" list below (event title + one-line summary per logged entry); empty until the user logs something.
  - **"+ LOG IMPACT"** opens a bottom sheet that REQUIRES tying the entry to a yes-RSVP'd event:
    1. If the user has no yes-RSVP'd events: show "RSVP \"yes\" to an event first, then come back here to log what you did for it" with just a close action.
    2. Otherwise: a picker list of eligible events (title + date) to select one.
    3. Once picked: reveal 3 number inputs (Bags of Trash, Miles Rucked, People Helped) + a "LOG IT FOR {event title}" submit button.
    - Submitting calls `logImpact`, closes the sheet, re-triggers count-up, shows a toast, and appends the "LOGGED FOR" row.
- **Org-wide ("OPERATOR STANDARD"):**
  - Small **2026 / ALL-TIME** period toggle top-right of the section (swaps the numbers between the two static sets).
  - A large hero stat card "LBS OF TRASH REMOVED" (huge mono number, count-up).
  - A 2×2 grid — Miles Rucked / Events Held / Lives Impacted / Active Members.
  - A closing motivating line. Not user-editable.

## Screen 5 — Itinerary Builder (`/itinerary`)

- Header "ITINERARY" + count label ("{N} EVENTS PLANNED"), reflecting the session itinerary.
- **Empty state:** icon + "Your plan is empty" + "Add events from the map to start building your week." + a "BROWSE EVENTS" button → Map.
- **Populated state:** ordered soonest-first list of saved events. Each row:
  - Date badge (day number + 3-letter month; **month colored by the event's category**).
  - Title, time + location.
  - A small **calendar-add icon button** → opens a `https://calendar.google.com/calendar/render?action=TEMPLATE&...` deep link for just that event (title, location, start/end from date+time+duration) in a new tab.
  - A **remove (×) button** → `removeFromItinerary`, updates the count and the nav badge.
  - **Tapping anywhere else on the row opens that event's Detail** — and Detail's back button must return to Itinerary (origin tracking from 1a). The calendar and remove buttons must `stopPropagation` so they don't also open Detail.
- **Footer button "EXPORT ALL — .ICS FILE":** generates and downloads a single `.ics` file containing every itinerary event as a `VEVENT` (SUMMARY/LOCATION/DTSTART/DTEND). Build the ICS string client-side and trigger a Blob download; fire a toast on download.

## Constraints

- Mock/session only; in-memory is fine.
- Token-only styling; nothing hardcoded. Reuse existing components — don't duplicate BottomSheet/Toast/Switch.
- Don't touch `design_handoff_muster_events_app/`.
- Keep `npm run build` and `npm run lint` clean.

## Definition of done

- Impact: YOU/ORG toggle works; personal 2×2 count-up animates on entry and tab-switch; THIS MONTH card renders; LOG IMPACT enforces the yes-RSVP gate (all 3 states), logs correctly (totals + events count + LOGGED FOR row + toast); org-wide hero + grid + 2026/ALL-TIME toggle work.
- Itinerary: empty vs populated states; soonest-first ordering; per-row category-colored date badge; calendar deep link opens correctly; remove updates count + nav badge; tapping the row (not the buttons) opens Detail and back returns to Itinerary; .ICS export downloads a valid multi-VEVENT file.
- Dark/light both correct; build + lint clean.

When done, summarize what you built, note deviations/TODOs, and confirm the definition-of-done checklist for review before Phase 1d (Sign In / Sign Up / Settings — the last Phase 1 sub-phase).
