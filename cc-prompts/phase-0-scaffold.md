# MUSTER — Phase 0: Scaffold, Design Tokens & App Shell

You are building **MUSTER**, a mobile-first PWA events + impact app for the "Operator Standard" community. This is Phase 0 of a phased build. Your job in this phase is ONLY to scaffold the project, encode the design system, and stand up the themed app shell + navigation. **Do not build feature screens or backend yet** — those are later phases.

## Read this first

The authoritative design spec lives in this repo at:
`design_handoff_muster_events_app/README.md`
and the pixel-accurate visual reference is:
`design_handoff_muster_events_app/Muster - Operator Standard Events.dc.html`

Open the HTML file in a browser to see intended look/states. NOTE: that HTML runs on a proprietary design-tool runtime (`{{ }}` bindings, `<sc-if>`/`<sc-for>`, `DCLogic`, `support.js`, `image-slot.js`) — **none of that is production code. Do not copy it.** Treat it as a literal spec only. Recreate everything in the real stack below.

## Stack (fixed — do not substitute)

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling (design tokens wired as CSS variables, consumed via Tailwind theme extension)
- **React Router** for navigation
- **PWA** via `vite-plugin-pwa`
- Package manager: npm
- Backend (Supabase) comes in a later phase — do NOT add it now.

## Deliverables for Phase 0

### 1. Project scaffold

- Initialize a Vite React-TS app at the repo root (keep `design_handoff_muster_events_app/` untouched as reference).
- Configure Tailwind, ESLint, Prettier, and a clean `tsconfig`.
- Set up folder structure: `src/{routes,components,lib,styles,theme}`.
- App must run with `npm run dev` and build clean with `npm run build`.

### 2. Fonts

Load from Google Fonts:

- **Anton** — display (wordmark, big headers, stat numbers). All-caps, tight tracking.
- **Barlow** (400–800) — UI/body.
- **JetBrains Mono** (400–700) — data/stats/timestamps/tags/counters.

### 3. Design tokens (exact values — copy precisely from README "Global Design Tokens")

Encode BOTH themes as CSS custom properties on a root element, switchable by a single global toggle. Dark is default/primary.

**Dark theme:** bg `#0e0f0c`, bg2 `#17190f`, card `#1b1e13`, cardAlt `#22261a`, line `rgba(245,243,234,.14)`, ink `#f5f3ea`, inkDim `#a3a394`, accent `#9CAF58`, accentOn `#12140c`, signal `#ff6a2b`, signalOn `#1b0700`, mapLand `#1c1e14`, mapWater `#12191d`, mapPark `#1e2417`, mapRoad `#2e3122`, mapRoadMain `#454833`, mapLabel `#8f8f78`.

**Light theme:** bg `#f2efe6`, bg2 `#e9e5d8`, card `#ffffff`, cardAlt `#f5f2ea`, line `rgba(20,21,15,.13)`, ink `#15160f`, inkDim `#63634f`, accent `#5c6b34`, accentOn `#ffffff`, signal `#e35b1f`, signalOn `#ffffff`, mapLand `#f2efe4`, mapWater `#cfe1e8`, mapPark `#dde8ca`, mapRoad `#ffffff`, mapRoadMain `#ecd9a0`, mapLabel `#6b6b58`.

**Category colors** (for small dots/badges only, not full fills): RUCK `#9CAF58`, CLEANUP `#5FA88C`, FITNESS `#D98A3D`, TRAINING `#C0392B`, MUSIC `#B08D57`, SOCIAL `#6E8AA6`, plus a neutral dot for a 7th user-defined "custom" category.

**Spacing/radii:** card radius 14px, pill/chip 999px, input 11px, button 10–12px, standard horizontal screen padding 18–20px.

Expose these through Tailwind (e.g. `bg-card`, `text-ink`, `border-line`, `bg-accent`, `text-signal`) so later phases never hardcode hex.

### 4. Global theme toggle

- Single app-wide dark/light toggle (sun/moon), swapping ALL tokens at once — not per-screen.
- Store the choice in a React context (persist to localStorage). Default dark.
- The toggle lives in the status-bar row of the phone shell (built below); Settings will later expose a second entry point to the same state.

### 5. PWA setup

- `vite-plugin-pwa` with a web manifest: name "Muster", short_name "Muster", `theme_color` `#0e0f0c`, `background_color` `#0e0f0c`, display `standalone`, portrait orientation.
- Placeholder app icons (192/512) are fine for now — flag them as TODO for real assets.
- Full-bleed frame, no browser chrome; account for safe-area insets around the status bar and bottom nav.

### 6. App shell + navigation (structure only — no screen content yet)

- **Phone-frame canvas:** 390×844 iPhone-style frame for local review (52px outer bezel radius, 38px inner screen radius). On real mobile viewports it should go full-bleed; the decorative frame is a dev/review convenience — make it easy to disable.
- **Status-bar row:** time, theme toggle (sun/moon), and a small circular account button (guest = generic person icon; this is the only auth entry point — wire it to a placeholder route for now).
- **Bottom tab bar** — persistent, 4 destinations:
  1. **Map** (pin icon)
  2. **Create** — elevated circular FAB in signal-orange with a "+", raised above the bar
  3. **Impact** (bar-chart icon)
  4. **Itinerary** (list icon, with a red numeric badge slot that shows an item count when > 0)
- Wire React Router routes for all 4 destinations plus placeholder routes for Event Detail (`/events/:id`), Sign In, Sign Up, and Settings. Each route renders a simple stub ("<Screen name> — coming in Phase 1") for now.
- Icons: hand-drawn inline SVG line icons (no icon font/library required). Simple placeholders are fine this phase.

## Constraints

- No feature logic, no mock event data, no backend, no auth implementation yet — just the shell, tokens, theming, and navigation skeleton.
- Everything themable strictly via tokens — zero hardcoded colors in components.
- Keep the `design_handoff_muster_events_app/` folder as-is (reference only).

## Definition of done

- `npm run dev` shows the phone-frame shell with a working bottom nav (4 destinations), a functioning dark/light toggle that recolors the whole UI, and correct fonts loaded.
- `npm run build` succeeds; app is installable as a PWA with the correct theme-color.
- All routes resolve to stub screens.
- A short `SETUP.md` documents how to run, and lists TODOs handed to later phases (real icons, app icons, screen content, Supabase).

When done, summarize what you built and confirm the definition-of-done checklist so it can be reviewed before Phase 1.
