# Muster — Setup

**Phase 0** delivered the project scaffold, design tokens, theming, and
app-shell navigation. **Phase 1** (1a–1d) built all 8 screens against
in-memory mock state — no backend, no real auth. **Phase 2** stood up a
real Supabase backend (project `muster`) and moved every screen onto real
data. **Phase 3** replaced mock auth with real Supabase auth (anonymous
sessions upgraded in place to permanent via email/phone OTP or Google/Apple
linking) and tightened RLS to per-owner. **Phase 4** built the three
undesigned robustness states (API error/retry, RSVP-at-capacity, dead-link
"Event not found") and the desktop two-pane layout. **Phase 5** (this one)
is deployment prep — see **Deploying MUSTER** below for the full runbook.

## Running

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. On a desktop-width viewport you'll see the
390×844 phone-frame dev canvas; resize the browser below `640px` wide (or
open on an actual phone) to see the real full-bleed layout.

```bash
npm run build      # type-checks (tsc -b) then builds to dist/
npm run preview    # serve the production build locally
npm run lint        # eslint .
npm run format       # prettier --write .
npm run format:check # prettier --check .
```

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`) — design tokens are CSS custom
  properties in [`src/styles/tokens.css`](./src/styles/tokens.css), mapped to
  Tailwind utilities via the `@theme` block in
  [`src/index.css`](./src/index.css). Every color/radius token in the design
  spec is available as a utility class (`bg-bg`, `text-ink`, `border-line`,
  `bg-accent`, `text-signal`, `bg-cat-ruck`, etc.) — components should never
  hardcode a hex value. `--warn`/`--danger` (RSVP Maybe/No) and
  `--radius-sheet` were added in Phase 1a — present in the design file's own
  style tile but missing from the Phase 0 README token table.
- React Router v7 (`BrowserRouter`)
- `vite-plugin-pwa` for the manifest + service worker

## Structure

```
src/
  components/   PhoneFrame, StatusBar, BottomNav, AppShell, ModalShell
                (+CloseButton), ModalLayout, StubScreen, BottomSheet,
                FilterSheet, ShareSheet, MapPanel, PhotoSlot, Switch,
                LogImpactSheet, icons.tsx
  components/
    create/     CategoryStep, BasicsStep, DetailsStep, ReviewStep — the
                4 Create-wizard steps, orchestrated by routes/CreateScreen
  routes/       One file per route — all 8 screens are fully built
  state/        SessionContext (events, RSVP, itinerary, personal impact
                totals, mock auth, notification prefs, filters, radius —
                in-memory only) and ToastContext (+ToastHost, mounted in
                AppShell)
  theme/        ThemeContext (dark/light, persisted to localStorage)
  styles/       tokens.css — the design-token source of truth
  lib/          mockEvents.ts (mock data + category metadata),
                filterEvents.ts (pure filter logic), format.ts,
                calendar.ts (Google Calendar link + .ics export),
                useCountUp.ts (stat count-up animation hook)
```

## Theming

Dark is default. `ThemeProvider` stamps `data-theme="dark"|"light"` on
`<html>` and persists the choice to `localStorage` (`muster:theme`). Two
entry points to the same state: the status-bar sun/moon toggle, and
Settings' Appearance segmented control (both call the same `setTheme`).

## Phone-frame dev canvas

`src/components/PhoneFrame.tsx` renders the decorative 390×844 bezel only at
`sm:` breakpoints and up; real mobile viewports always render full-bleed. To
disable the dev bezel entirely, flip `SHOW_DEV_BEZEL` to `false` at the top
of that file.

## Routes

| Path          | Screen         | Status           |
| ------------- | -------------- | ---------------- |
| `/`           | Map            | Built (Phase 1a) |
| `/events/:id` | Event Detail   | Built (Phase 1a) |
| `/create`     | Create Event   | Built (Phase 1b) |
| `/impact`     | Impact         | Built (Phase 1c) |
| `/itinerary`  | Itinerary      | Built (Phase 1c) |
| `/sign-in`    | Sign In        | Built (Phase 1d) |
| `/sign-up`    | Create Account | Built (Phase 1d) |
| `/settings`   | Settings       | Built (Phase 1d) |

Map/Create/Impact/Itinerary/Event Detail share `AppShell` (status bar +
persistent bottom nav — each screen owns its own scroll region rather than
the shell forcing one). Sign In/Sign Up/Settings share `ModalLayout` +
`ModalShell` (close-X header, no bottom nav).

## Mock data & session state (Phase 1a)

- `src/lib/mockEvents.ts` — 10 mock events (`MOCK_EVENTS`), pre-sorted
  soonest-first. Includes a mix of free/paid, one `capacity: null` (no cap),
  two with a `website`, and one with a category outside the 6 built-ins
  (`"skirmish"`) to exercise the neutral custom-category fallback.
- `src/lib/filterEvents.ts` — pure `filterEvents()` + `hasActiveFilters()`.
  Search matches title/organizer/location; radius, category, free-only, and
  date (`any`/`week`/`month`/`custom`) all combine with AND semantics.
  "This week"/"This month" use the real system clock — the dev sandbox's
  clock is set to 2026-08-01 to match the mock data's date range; on a host
  with a different clock those two presets would show nothing.
- `src/state/SessionContext.tsx` — in-memory only (no localStorage yet):
  RSVP per event, itinerary event ids, and the active filters/radius/search.
  Tapping RSVP "yes" auto-adds to itinerary (toast, once); un-RSVPing does
  not auto-remove (matches spec). The manual "Add/Remove from itinerary"
  button is an independent toggle.
- Deep links are real routes now, not hash-based (`/events/:id`, not
  `#event-<id>` like the design prototype) — `useParams` + a normal
  `<Navigate>` fallback for unknown ids replaces the prototype's
  `location.hash` restoration entirely.

## Create wizard (Phase 1b)

- `src/state/SessionContext.tsx` now owns `events` — `MOCK_EVENTS` plus a
  session-local `postedEvents` array, prepended on `addEvent()` and merged
  as `[...postedEvents, ...MOCK_EVENTS]`. MapScreen and EventDetailScreen
  both read `session.events` instead of importing `MOCK_EVENTS` directly, so
  a posted event is immediately visible everywhere.
- Posting computes defaults exactly as briefed: `distanceMi: 0.1`,
  `x: 50, y: 50` (map center), `cost: "FREE"` if blank (else `$`-prefixed),
  `capacity: null` if blank, `goingCount`/RSVP/itinerary driven by "Am I
  going?", `website: null` if blank, `photoUrl: null` always (no real
  upload path exists yet — see PhotoSlot TODO below). Blank date/time fall
  back to today (`todayIso()`, local-date-safe, not `toISOString()`) and
  noon.
- Custom category uses the same `category === "custom"` sentinel pattern as
  the design file: selecting "+ ADD YOUR OWN CATEGORY" enables Continue
  immediately (before typing a name), matching the reference's literal
  behavior. `getCategoryMeta()` already falls back to the neutral
  `--cat-custom` dot for any unrecognized category string, so this needed
  no changes.
- Wizard form state (`CreateFormState`, in `routes/CreateScreen.tsx`) is
  local to the Create flow per the brief — it resets on both close (X) and
  successful post, never bleeds into `SessionContext`.
- Reused `Switch` as-is for "Am I going?" rather than forking a second
  toggle for a 4px size difference from the reference (46×26 vs the
  existing 42×24) — the brief explicitly said reuse, not fork.
- Picked up one small Phase 1a consistency fix while in this code: filter
  sheet category chips now get an explicit `bg-card` when inactive
  (matching the design file's literal value), which they were missing.

## Impact + Itinerary (Phase 1c)

- `src/state/SessionContext.tsx` gained `personalImpact` (seeded non-zero:
  46 bags / 128.4 mi / 310 people / 34 events, so the count-up is visible
  immediately), `loggedFor`, and `logImpact()`. `removeFromItinerary` —
  trimmed as dead code at the end of Phase 1a — is back, now genuinely used
  by Itinerary's remove (×) button.
- `src/lib/useCountUp.ts` — count-up re-animates on mount (covers "on
  entry"/"on tab-switch" for free, since Impact's YOU/ORG views are
  conditionally rendered and so remount on every switch) and whenever the
  target values themselves change (covers "re-trigger after logging" and
  the 2026/ALL-TIME toggle) — no separate manual trigger needed either way.
- `LOGGED FOR` entries only store the formatted `summary` string (per the
  brief's exact shape), not raw bags/miles/people — so the "THIS MONTH"
  card's motivating line is derived from `loggedFor.length` rather than a
  specific mileage figure, since reconstructing a reliable number would mean
  parsing that string back apart. Real per-entry dates (for an actual
  calendar-month scope, vs. "this session") are a Supabase-phase concern.
- The design file's own THIS MONTH / org-hero gradients use invalid CSS
  (`var(--accent) 22` — a stray design-tool string-concat artifact, not
  valid syntax). Rebuilt with `color-mix(in srgb, var(--accent) N%,
transparent)` to get the same accent-tinted-fading-to-card intent with
  real CSS.
- `src/lib/calendar.ts` — the brief asked for the Google Calendar link and
  `.ics` export to compute real start/end from date+time+duration, unlike
  the design file's own shortcut (same start/end timestamp for every
  event, no duration math). Implemented `eventDateRange()` parsing our
  display-ready `time` string back to 24h and adding `durationLabel`
  (handles "All day" as a real all-day span too) — shared by both the
  per-row Google Calendar deep link and the multi-VEVENT `.ics` file.
- Verified `buildGoogleCalendarUrl`/`buildIcsCalendar` output directly
  (re-deriving the same date math in the browser console) since the
  sandbox's popup blocker prevents actually observing `window.open` /
  file-download side effects in this environment.

## Sign In / Sign Up / Settings (Phase 1d)

- `src/state/SessionContext.tsx` gained `auth: { signedIn, name, contact }`
  (mock only) with `signIn()`/`signUp()`/`signOut()`, plus `eventReminders`/
  `newEventsNearby` notification prefs with setters. `StatusBar`'s account
  button now reads real `auth.signedIn` instead of a hardcoded `true`.
- **`ModalShell` was generalized, not forked.** Its original Phase 0 shape
  assumed one header layout (centered title, symmetric spacer) that only
  actually matches Settings — Sign In/Sign Up's real design has a standalone
  close button on its own row, then a separate large left-aligned title
  block below. Rather than fork a second shell, `ModalShell` was simplified
  to just the shared scroll/padding wrapper, and a new shared `CloseButton`
  was extracted so both header shapes reuse the same button styling while
  composing their own layout. Settings' pixel output is unchanged.
- Google/Apple buttons in the design file are actually unwired (no
  `onClick` at all — the design tool can't simulate real OAuth). The brief
  asked for them to work as mock sign-in regardless, so both call
  `signIn()` with a placeholder identity (`Google User` /
  `you@gmail.com`, etc.) — clearly marked `TODO(Phase 3)` for real OAuth.
- **Found and fixed a real race condition**, not just a design gap: LOG OUT
  called `signOut()` then `navigate("/")`, but Settings' own
  "redirect signed-out visitors to Sign In" guard is a _direct context
  consumer_ of `auth` — React re-renders it with the new `signedIn: false`
  before `<Routes>` finishes swapping away from `/settings`, so the guard's
  own `<Navigate to="/sign-in">` fired and won the race, landing on Sign In
  instead of Map. Fixed by only guarding on a _direct arrival_ while already
  signed out (tracked via a one-way "was ever signed in this mount" latch,
  using React's documented render-time state-adjustment pattern rather than
  a ref, since this repo's lint config treats ref-mutation-during-render as
  an error). Verified both paths after the fix: LOG OUT → Map with the
  account icon reverting to guest; a direct `/settings` visit while signed
  out → still correctly redirects to Sign In.
- Settings' Appearance control calls the exact same `ThemeContext.setTheme`
  as the status-bar sun/moon toggle — confirmed by watching the whole app
  repaint when toggled from Settings.

## Deploying MUSTER

Target host: **Vercel**. Production domain: **www.eventmuster.com** (apex
`eventmuster.com` redirects to `www`). Backend: Supabase project `muster`
(ref `tqivrtrlnwuaxhzjklaz`, structteck org) — already live; nothing changes
there except the Auth URL configuration in step 5 below.

### Done (Phase 5)

- [`vercel.json`](./vercel.json) — SPA rewrite (`/(.*) → /index.html`, so a
  direct load or refresh of `/events/:id`, `/settings`, etc. resolves
  instead of 404ing on Vercel's static file host) plus long-lived immutable
  caching for the content-hashed `/assets/*` bundle, and no-cache for
  `sw.js` / `registerSW.js` / `manifest.webmanifest` so PWA updates roll out
  promptly instead of getting stuck behind a stale cached service worker.
  Build command `npm run build`, output directory `dist` — both are Vite's
  own defaults and are pinned explicitly in `vercel.json`, so Vercel's
  dashboard settings just need to agree with what's already there.
- `.env.example` documents both variables the client needs at build time
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) with no values — real
  values get set in Vercel's dashboard (Director step 3 below), never
  committed.
- `.gitignore` confirmed to exclude `node_modules`, `dist`, `*.local`
  (covers `.env.local`), and `.claude/settings.local.json` (machine-specific
  tool permissions — `.claude/launch.json` IS committed; it's the shared
  dev-server config, no secrets in it).
- PWA verified against the actual production build (`npm run build` →
  `npm run preview`, not just `npm run dev`): manifest serves correctly,
  `theme_color`/`background_color` = `#0e0f0c` in both the manifest and the
  `<meta name="theme-color">` tag, the service worker registers and
  activates, and all 4 icon files load with correct content-types. **Open
  TODO** (see below): the icons themselves are still Phase 0 placeholders.
- Repo is git-initialized with a clean first commit — nothing under
  `dist/`, `node_modules/`, or any `.env*` file other than the safe
  `.env.example` is tracked.
- Verified locally against the production build: both a real event id and a
  nonexistent one resolve correctly when `/events/:id` is loaded as a
  **direct URL** (not client-side navigation) — confirms the SPA-fallback
  behavior `vercel.json` replicates for Vercel's static hosting actually
  works, not just React Router's in-app navigation.

### Director steps — do these in order

1. **Push to GitHub.** Create a new empty repo (no README/gitignore/license
   — this repo already has all three) at e.g. `github.com/<you>/muster`,
   then from this directory:
   ```bash
   git remote add origin git@github.com:<you>/muster.git
   git branch -M main
   git push -u origin main
   ```
   (swap the SSH URL for HTTPS if that's your usual auth method).

2. **Import into Vercel.** New Project → import the GitHub repo → framework
   preset **Vite** (auto-detected) → build command `npm run build` → output
   directory `dist` (all match what's already pinned in `vercel.json`, so
   this should just confirm itself rather than need changes).

3. **Environment variables.** Vercel → Settings → Environment Variables,
   add for **both Production and Preview**:

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → `muster` project → Settings → API → Project URL |
   | `VITE_SUPABASE_ANON_KEY` | same page → Project API keys → `anon` `public` key |

   These are read at **build time** (Vite inlines them into the bundle), so
   a redeploy is required any time either value changes.

4. **Domains.** Vercel → Settings → Domains:
   - Add `www.eventmuster.com` as the primary domain.
   - Add apex `eventmuster.com` and set it to redirect to `www` — Vercel
     offers this as a one-click option once `www` is already attached.
   - Vercel will display the exact records to add; they'll look like:

     | Type | Host | Value |
     |---|---|---|
     | CNAME | `www` | `cname.vercel-dns.com` |
     | A / ALIAS / ANAME | `@` | *(Vercel gives you the current IP/target — use theirs)* |

   - Add those in Namecheap → Domain List → `eventmuster.com` → Manage →
     Advanced DNS. **These coexist with the existing Resend email records**
     (below) — the web records live on `@`/`www`, the email records live on
     the `send` subdomain. Different hosts, no conflict, nothing to migrate.

5. **Supabase Auth URL configuration.** Supabase dashboard → `muster`
   project → Authentication → URL Configuration:
   - **Site URL** → `https://www.eventmuster.com`
   - **Redirect URLs** allow-list → add `https://www.eventmuster.com/**`
     and the Vercel preview-deployment domain pattern (e.g.
     `https://muster-*.vercel.app/**` — use whatever pattern Vercel assigns
     this project) — and keep `http://localhost:5173/**` for local dev.
   - This matters for every auth redirect flow — OAuth linking, email/phone
     OTP, email-change confirmation — they all redirect back to whatever's
     configured here, not to `window.location.origin` blindly.

6. **(Still pending from Phase 4) OTP email template.** Supabase →
   Authentication → Email Templates → both **Confirm signup** and
   **Change Email Address** (and **Magic Link** too, if you want that path
   available) — edit the body to include `{{ .Token }}` (the 6-digit code),
   not just `{{ .ConfirmationURL }}`. Until this is done, the app's OTP
   code-entry screen has nothing to display — confirmed still pending as of
   Phase 4's verification pass.

### Email sending — Resend SMTP (already configured)

Supabase's built-in email sender is rate-limited (a handful of sends/hour)
and unsuitable for real signups — Auth → Settings → SMTP Settings has been
pointed at a custom **Resend** SMTP relay instead:

| Setting | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (STARTTLS) |
| Username | `resend` |
| Password | *(a Resend API key — lives only in Supabase's SMTP settings, never in this repo; referred to here as `RESEND_SMTP_PASSWORD`)* |
| Sender email | `no-reply@send.eventmuster.com` (the `send` subdomain) |

Resend verifies the sending domain via DNS records added in Namecheap on
`send.eventmuster.com` (typically an MX record plus SPF/DKIM TXT records,
supplied by Resend's dashboard at domain-add time). These live entirely on
the `send` host, separate from the apex/`www` web records added in Director
step 4 — the two setups don't overlap.

If email deliverability ever needs debugging: check Resend's own delivery
log first, then Supabase's Auth logs.

## Remaining open TODOs

Everything in the original Phase 1 list (Supabase backend, real photo
upload, desktop two-pane layout, event-not-found handling) shipped in
Phases 2–4. What's actually still open, as of Phase 5:

- **Real app icons** — `public/pwa-192.png`, `public/pwa-512.png`,
  `public/apple-touch-icon.png`, and `public/favicon.svg` are all still the
  Phase 0 programmatically-generated placeholders. Swap for real brand
  artwork — a design asset, not a blocker for launch.
- **OTP email template** — the Confirm-signup / Change-email templates in
  Supabase still send a magic link, not a `{{ .Token }}` code, so the app's
  OTP code-entry screen has nothing to display yet. See **Deploying
  MUSTER → Director steps** below.
- **Google / Apple / phone sign-in** — code paths exist and fail gracefully
  (toast, no crash) but need real provider credentials configured in the
  Supabase dashboard before they're live.
- **Settings avatar for anonymous→permanent upgrades via `updateUser`
  outside the app's own OTP flow** — edge case only; the normal in-app path
  (Sign Up/Sign In → OtpStep → verify) upserts the profile correctly.
- **Deferred to a later, post-deployment phase on purpose** (per the Phase 4
  brief, not an oversight): OG/social share previews, push notifications,
  and anti-spam hardening (rate limits, moderation, captcha, and moving
  RSVP-at-capacity enforcement server-side via a DB check/trigger).
