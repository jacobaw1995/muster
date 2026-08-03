# Handoff: Muster — Operator Standard Events & Impact App

## Overview

Muster is a mobile-first community events and impact platform for the Operator Standard community — an open-access hub (browsing, RSVP, and event creation do NOT require an account) where members discover, create, and RSVP to local events (rucking, cleanups, fitness, training, music, social) and track collective/personal impact (miles rucked, trash removed, people helped). An optional account layer exists for calendar sync and cross-device persistence (see Screens 6–8).

## About the Design Files

The file in this bundle (`Muster - Operator Standard Events.dc.html`) is a **design reference built in HTML** — a working interactive prototype showing intended look, states, and behavior. It is NOT production code to copy directly. It runs on a small proprietary templating/runtime layer (custom `{{ }}` bindings, `<sc-if>`/`<sc-for>` control tags, a `DCLogic` class) that only exists in this design tool — none of that is available in a real codebase.

**The task is to recreate this design in the target codebase's actual stack** (React, Vue, SwiftUI, native Android, etc.) using its existing component library, state management, routing, and design tokens — or, if no stack exists yet, choose the most appropriate framework and build fresh. Treat the HTML file as a literal, pixel-accurate spec of layout/copy/behavior, not as source to paste in.

`image-slot.js` is a design-tool-only placeholder component (drag-and-drop image upload with local persistence) — in production this should become a real image upload/CDN-backed photo picker.

## Fidelity

**High-fidelity.** Colors, type, spacing, copy, and interaction states shown are final intent. Recreate pixel-accurately using the codebase's own component primitives.

## Global Design Tokens

### Color — Dark theme (primary)

| Token       | Hex/Value               | Use                                                                    |
| ----------- | ----------------------- | ---------------------------------------------------------------------- |
| bg          | `#0e0f0c`               | App background                                                         |
| bg2         | `#17190f`               | Secondary background                                                   |
| card        | `#1b1e13`               | Card/input surface                                                     |
| cardAlt     | `#22261a`               | Nested card surface                                                    |
| line        | `rgba(245,243,234,.14)` | Borders/dividers                                                       |
| ink         | `#f5f3ea`               | Primary text (bone white)                                              |
| inkDim      | `#a3a394`               | Secondary/muted text                                                   |
| accent      | `#9CAF58`               | Primary brand olive (active states, primary buttons, YES/going)        |
| accentOn    | `#12140c`               | Text on accent fill                                                    |
| signal      | `#ff6a2b`               | CTA / high-emphasis action (safety orange — Create button, Post Event) |
| signalOn    | `#1b0700`               | Text on signal fill                                                    |
| mapLand     | `#1c1e14`               | Map basemap                                                            |
| mapWater    | `#12191d`               | Map water shape                                                        |
| mapPark     | `#1e2417`               | Map park/green shape                                                   |
| mapRoad     | `#2e3122`               | Minor road grid lines                                                  |
| mapRoadMain | `#454833`               | Arterial road lines                                                    |
| mapLabel    | `#8f8f78`               | Map text labels                                                        |

### Color — Light theme (alternate)

| Token       | Hex/Value            |
| ----------- | -------------------- |
| bg          | `#f2efe6`            |
| bg2         | `#e9e5d8`            |
| card        | `#ffffff`            |
| cardAlt     | `#f5f2ea`            |
| line        | `rgba(20,21,15,.13)` |
| ink         | `#15160f`            |
| inkDim      | `#63634f`            |
| accent      | `#5c6b34`            |
| accentOn    | `#ffffff`            |
| signal      | `#e35b1f`            |
| signalOn    | `#ffffff`            |
| mapLand     | `#f2efe4`            |
| mapWater    | `#cfe1e8`            |
| mapPark     | `#dde8ca`            |
| mapRoad     | `#ffffff`            |
| mapRoadMain | `#ecd9a0`            |
| mapLabel    | `#6b6b58`            |

Theme is a single global toggle (sun/moon icon in the status bar area) swapping all tokens above — not per-screen.

### Category color-coding (used only as small dots/badges, not full chip fills — keeps UI restrained)

- RUCK `#9CAF58` · CLEANUP `#5FA88C` · FITNESS `#D98A3D` · TRAINING `#C0392B` · MUSIC `#B08D57` · SOCIAL `#6E8AA6`
- A 7th "custom" category is user-defined text with a neutral dot.

### Typography

- **Display**: Anton (wordmark, big headers, stat numbers on Impact) — all-caps, tight tracking.
- **UI/body**: Barlow, weights 400–800.
- **Data/mono**: JetBrains Mono — used for stats, timestamps, category tags, counters, step labels.
- Base UI copy ~11–14px; stat numbers 24–44px; wordmark 24–52px depending on context.

### Spacing / radii

- Card radius: 14px. Pill/chip radius: 999px (full). Input radius: 11px. Button radius: 10–12px.
- Phone frame: 390×844 canvas (iPhone-style), 52px outer bezel radius, 38px inner screen radius.
- Standard horizontal screen padding: 18–20px.

## Navigation

Bottom tab bar, 4 destinations, persistent across the app:

1. **Map** (pin icon)
2. **Create** (elevated circular FAB in signal-orange, "+" icon, raised above the bar)
3. **Impact** (bar-chart icon)
4. **Itinerary** (list icon, red numeric badge showing item count when > 0)

Tapping a destination is a full state/screen switch (not native routing) — recreate as your framework's normal navigation/router.

**Account entry point:** a small circular button lives in the status bar row, next to the theme toggle. Guests see a generic person icon (→ opens Sign In); signed-in users see their initials (→ opens Settings). This is the only entry point into auth/settings — there is no dedicated nav tab for it.

---

## Screens

### 1. Home / Map (primary/hero screen)

**Purpose:** Discover nearby events on a map + scrollable list; filter and search.

**Layout (top to bottom):**

- Status bar row: time, theme toggle (sun/moon), signal dots.
- Header row: "MUSTER" wordmark + live event count ("N EVENTS").
- Search bar (magnifying-glass icon + text input, placeholder "Search events, orgs, spots") + a filter icon button (opens filter bottom sheet; shows a small orange dot badge when any filter is active).
- Demo/dev state switcher row: 3 segmented buttons — **LIVE / LOADING / NO EVENTS** — toggles which of the 3 designed states below renders. **This row is a prototype-only affordance for reviewing the 3 states; it should NOT ship in production** — in the real app the screen simply reflects real data/loading/empty state automatically.
- Map panel (fixed height ~280px, rounded corners, bordered):
  - Styled like Google/Apple Maps: flat basemap color, a water shape (bottom-right), a park/green blob, a thin grid of minor roads, 2 thicker arterial roads, small text labels (a neighborhood label, a couple of street-name labels rotated along their roads, a "county/city" label top-left).
  - Category-colored map pins (teardrop/pin shape) placed by lat/lng-equivalent x/y percent; tapping a pin opens Event Detail for that event.
  - "Near Me" circular button (bottom-right) — toggles a "centered on me" visual state (icon fill changes).
  - Radius control (bottom-left pill button, e.g. "25 MI RADIUS ▾") — **tappable**: cycles through 10/25/50/100 mi, and actually filters the event list/pins by that radius. Also duplicated as a full picker (10/25/50/100 mi buttons) inside the filter sheet.
- Scrollable event list below the map, header "UPCOMING NEAR YOU":
  - Each row: 64×64 photo thumbnail (user-uploadable in production; category-color dot badge bottom-right of the thumbnail) — category label (mono, category color) + distance — event title (bold) — date/time + location (truncated) — cost badge ("FREE" or "$N") + "{N} going".
  - Tapping a row opens Event Detail for that event and updates the URL (see Sharing, below).
- 3 designed data states (governed by the dev-only switcher above, but represent real states your build must handle):
  - **Live**: map pins + list populated as above.
  - **Loading**: map area shows a spinner + "LOCATING EVENTS…"; list shows 3 pulsing skeleton rows.
  - **No events / empty**: map area shows an icon + "Nothing happening nearby" + "No events within 25 mi. Widen your radius or be the first to post one."; list area shows "Start something. Rally the community around it." + a "POST AN EVENT" CTA that opens Create.

**Filter bottom sheet** (slides up from bottom, scrim behind):

- Category multi-select chips (all 6 categories, pill buttons with dot + label, toggle on/off, active state = colored border/fill).
- "WHEN" section: quick presets _Any time / This week / This month / Pick dates_. Selecting "Pick dates" reveals two date inputs (From / To) for a custom range.
- "SEARCH RADIUS" section: 10/25/50/100 mi picker (same state as the map's radius pill).
- "Free events only" toggle (switch control).
- "CLEAR" (resets all filters) and a primary "SHOW {N} EVENTS" button that closes the sheet.
- Search bar text also matches against event title, organizer name, AND location text — so typing a city/venue name works as a location search; there is no separate city/state field.

### 2. Event Detail

**Purpose:** Full event info + RSVP + share + save.

**Layout:**

- Hero photo (150px tall, full width) — user-uploadable image; back button (top-left, circular, translucent) and share button (top-right, circular, translucent) float over it.
- Category pill badge (colored outline/fill) + event title (large display font) + "Hosted by {org}".
- Info card: date row (calendar icon + date + "{time} · {duration}"), location row (pin icon + location name + distance), and a cost/capacity row (clock icon + cost badge, people icon + "{going}/{capacity} CAP").
- "ORGANIZER NOTES" section — free-text notes from the organizer.
- **Host website link** (conditional): when an event has an external `website` URL — i.e. it originated outside Muster and is just being cross-posted (e.g. a ticketed show run through a venue's own site) — show an outlined "VISIT HOST WEBSITE & TICKETS ↗" link/button under Organizer Notes that opens the URL in a new tab. Hidden entirely when no URL is set. The Create flow lets a poster optionally attach this URL (see Screen 3, Step 3).
- "ARE YOU IN?" section — RSVP segmented control: **YES / MAYBE / NO** buttons (each togglable — tapping the active one clears your RSVP), live counts shown above ("{n} going · {n} maybe"), and a row of attendee name chips (first 4 real names + "+N more"). **Tapping YES also automatically adds the event to the user's Itinerary** (if not already added) — RSVP'ing yes and saving to your plan are the same action from the user's perspective; a toast confirms "Added to itinerary". Un-RSVP'ing (tapping YES again to clear it) does NOT auto-remove it from the itinerary — that stays a manual action.
- Bottom actions: "ADD TO ITINERARY" / "IN YOUR ITINERARY" primary button (toggles, shows a checkmark + swaps color when already added; this is the manual/independent path onto the itinerary, separate from the RSVP auto-add above) + a secondary share icon button.
- Share bottom sheet: shows a small social-preview card (photo thumbnail + event title + the shareable URL) so the user can see what a recipient would see, plus "COPY LINK" and "TEXT A FRIEND" actions.
- **Back button behavior:** the top-left back button returns the user to wherever they opened this Detail screen from — Map (default) or Itinerary, if that's where they tapped in from. Track the origin screen when navigating into Detail and pop back to it.

**Unique shareable URL:** Each event has a deep link of the form `#event-<id>` (or, in a real app, `/events/<id>`). Opening that URL directly should land the user straight on that event's Detail screen (the prototype restores state from `location.hash` on load). The share preview shows the event photo, title, and link — in production this should back a real Open Graph image/meta so social platforms render the photo when the link is pasted (the prototype cannot do true server-rendered OG tags; it only simulates the preview in-app).

### 3. Create Event (4-step wizard)

**Purpose:** Post a new event in under 60 seconds.

**Shell:** Header "POST AN EVENT" with a close (X) button (top-left — exits the wizard back to Map, resetting the form) + "STEP N OF 4" label + a 4-segment progress bar. Footer has a back arrow (steps 2–4 only) + a primary Continue/Post button — **disabled state must be visually distinct (dimmed ~45% opacity) as well as functionally disabled**, and the footer must always render above the bottom tab bar (do not let it get covered).

- **Step 1 — Category:** Grid of 6 category chips (dot + label, same categories as elsewhere) + a full-width dashed "+ ADD YOUR OWN CATEGORY" button that reveals a free-text input for a custom category name. Continue is disabled until a category (built-in or custom) is chosen.
- **Step 2 — Basics:** Title (text input), Location (text input), Date + Time (two inputs side by side), and a **Duration** picker — 6 buttons: 1 hour / 2 hours / 3 hours / 4 hours / 6 hours / All day (single-select, default "2 hours"). Continue disabled until Title and Location are filled.
- **Step 3 — Optional details:** Cost (text, placeholder "Free"), Capacity (text, placeholder "No limit") side by side — **these two inputs must be equal width and their combined row must align exactly with the full-width Notes textarea below** (both should reach the same right edge; set `box-sizing:border-box; width:100%` on both inputs to guarantee this — don't rely on flex-stretch alone). Notes (multi-line textarea). **Host Website** (optional text input, placeholder "https://…", labeled to clarify it's for events not run through Muster — e.g. ticket links) — populates the Event Detail "Visit host website" link. Photo (image upload slot, optional).
- **Step 4 — Review & post:** Read-only summary card (category, title, date/time/duration, location) + an "Am I going?" toggle switch (default on) + final button reads "POST EVENT". Submitting adds the event to the top of the Map's list (marked as attending if the toggle was on), returns to Map, and shows a confirmation toast ("Event posted — live now").

### 4. Impact Dashboard

**Purpose:** Show personal and org-wide collective-good metrics.

**Layout:**

- Header "IMPACT" + (Personal tab only) a "+ LOG IMPACT" button, top-right.
- Segmented control: **YOU** / **OPERATOR STANDARD** (org-wide).
- **Personal ("YOU") view:** "Your running totals — all-time" label, 2×2 stat grid — Bags of Trash, Miles Rucked, People Helped, Events Showed Up For (large mono numbers, count-up animation on entry/tab-switch) — plus a highlighted "THIS MONTH" summary card with a short motivating sentence.
  - **"+ LOG IMPACT"** opens a bottom sheet that **requires tying the entry to a specific event you RSVP'd "yes" to** — impact isn't logged freeform. Flow: (1) if the user has no yes-RSVP'd events, show "RSVP \"yes\" to an event first, then come back here to log what you did for it" with just a close action; (2) otherwise show a picker list of eligible events (title + date) to select one; (3) once an event is picked, reveal 3 number inputs (Bags of Trash, Miles Rucked, People Helped) and a "LOG IT FOR {event title}" submit button. Submitting adds the entered amounts to the user's running totals, increments the Events count by 1, re-triggers the count-up animation, shows a toast, and appends a row to a "LOGGED FOR" list on the Personal Impact screen (event title + a one-line summary of what was logged, e.g. "3 bags · 5.5 mi"). **This is the mechanism for where personal impact data comes from** — self-reported logging by the member, always attributed to a real attended/RSVP'd event (in production, likely also auto-suggested/pre-filled from event category and attendance records, with manual entry as the confirm/adjust step).
- **Org-wide ("OPERATOR STANDARD") view:** small **2026 / ALL-TIME** period toggle, top-right of the section. A large hero stat card ("LBS OF TRASH REMOVED", huge mono number, count-up), then a 2×2 grid — Miles Rucked, Events Held, Lives Impacted, Active Members — plus a closing motivating line. This view is aggregate/community data — **not user-editable**; it should be computed/aggregated server-side from all members' logged and attended activity.

### 5. Itinerary Builder

**Purpose:** A personal running list of events the user has saved, exportable to a calendar.

**Layout:**

- Header "ITINERARY" + count label ("{N} EVENTS PLANNED").
- **Empty state:** icon + "Your plan is empty" + "Add events from the map to start building your week." + "BROWSE EVENTS" button (→ Map).
- **Populated state:** ordered list (soonest first) of saved events — each row: date badge (day number + 3-letter month, month colored by category), title, time + location, a small calendar-add icon button (adds just that one event to Google Calendar via a `calendar.google.com/render` deep link), and a remove (×) button. **Tapping anywhere else on the row opens that event's Detail screen** (the calendar and remove buttons stop event propagation so they still work independently without also opening Detail).
- Footer button: **"EXPORT ALL — .ICS FILE"** — generates and downloads a single `.ics` file containing every itinerary event as a `VEVENT` (title, location, start/end).

### 6. Sign In

**Purpose:** Optional authentication — not required to browse, RSVP, or post events; needed for calendar sync and cross-device persistence.

**Layout:** Close (X) button (top-left → back to Map). "SIGN IN" header + subtitle explaining it's optional ("Sync your RSVPs, itinerary, and calendar across devices. You can keep browsing without an account."). "Continue with Google" and "Continue with Apple" buttons (full-width, icon + label). An "OR" divider. An "Email or phone" text input + "CONTINUE" button (single field — no separate password step in this flow; treat as the entry point to whatever passwordless/OTP or password flow your backend uses). Below: "New here? Create an account" link (→ Sign Up) and a plain-text underlined "Continue browsing as guest" link (→ Map, no auth).

### 7. Create Account (Sign Up)

**Purpose:** Create an account for calendar sync / saved RSVPs — explicitly optional, reiterated here.

**Layout:** Close (X) → Map. "CREATE ACCOUNT" header + subtitle reiterating guest browsing already works. Name (text input), Email or phone (text input), "CREATE ACCOUNT" button — **disabled + dimmed (~45% opacity) until both fields are filled**. Below: "Already have an account? Sign in" link (→ Sign In). Submitting signs the user in immediately (no separate verification step designed) and returns to Map with an "Account created" toast.

### 8. Settings

**Purpose:** Minimal account/profile management for signed-in users.

**Layout:** Close (X) + "SETTINGS" header (centered, back button left, symmetric spacer right) → Map.

- **Profile row:** circular photo slot (user-uploadable avatar) + name + email/phone, in a bordered card.
- **NOTIFICATIONS section:** two toggle rows — "Event reminders" (upcoming RSVP'd events) and "New events near me" (both default on). These are the two notification types in scope for this design; more may be added later.
- **APPEARANCE section:** a Dark/Light segmented control — the same global theme state used everywhere else in the app (this is just a second, more discoverable entry point to it alongside the status-bar sun/moon toggle).
- **ACCOUNT section:** "Connect Google Calendar" button (in this prototype just confirms via toast; wire to real OAuth in production) and a "LOG OUT" button (returns the user to guest state and Map).

**Explicitly out of scope for this design pass:** a friends/follow directory or social graph. Per product decision, "seeing who's going" is handled entirely by the attendee name chips already on Event Detail (Screen 2) — no separate people-directory screen was designed.

---

## Interactions & Behavior Summary

- RSVP, itinerary add/remove, filters, and create-form fields are all local/session state in the prototype — in production these should be persisted per-user server-side.
- Theme (dark/light) is a single toggle affecting the whole app; dark is default/primary.
- Toasts: small pill notification, bottom-center, auto-dismiss (~2.2s) — used for RSVP-adjacent actions (added/removed from itinerary), link copied, event posted, impact logged, .ics downloaded.
- All modals/sheets (filter, share, log-impact) are bottom sheets with a scrim; tapping the scrim or a close action dismisses them.
- Disabled buttons (e.g. wizard Continue before required fields are filled) must be both non-interactive and visually dimmed.

## Empty / Loading / Error States Covered

- Map: Live / Loading / Empty (see Screen 1).
- Itinerary: Empty vs. populated (see Screen 5).
- Search/filter with zero results: "No matches for "{query}". Try clearing filters." shown in place of the list.
- (Not designed here — flag for follow-up with the design team: network/API error states, RSVP-at-capacity state, and event-not-found for a dead share link.)

## Desktop Adaptation (documented, not fully mocked)

Home/Map becomes a two-pane layout: a persistent left rail (~420px — search, filters, scrollable list) beside a large map filling the rest of the viewport. The bottom nav becomes a slim top bar (same 4 destinations + wordmark). Event Detail and Create open as a right-side panel over the map (not a modal), keeping the map visible. Impact and Itinerary keep their mobile structure but center in a max-width 720px column.

## PWA Intent

Full-bleed frame, no browser chrome; safe-area padding already accounted for around the status bar and bottom nav; dark theme intended to match a manifest `theme-color` of `#0e0f0c` so the OS status bar blends in on install.

## Assets

No photographic assets are used — all "photo" surfaces (event thumbnails, event hero image, create-flow photo step) are placeholder drop-zones (`image-slot.js`, design-tool-only) awaiting real user-uploaded photos. All icons are hand-drawn inline SVG (simple line icons) — recreate with your icon system of choice; no icon font or library is required by the design.

## Files in this bundle

- `Muster - Operator Standard Events.dc.html` — the full interactive design reference (open in a browser to explore all screens/states), current as of the latest round of revisions (auth/settings screens, duration field, host-website links, event-tied impact logging, itinerary auto-add-on-RSVP, itinerary-origin back nav, radius/date-range filters).
- `image-slot.js` — placeholder image-upload component referenced by the design file (design-tool-only, not for production use).
- `README.md` — this document.
