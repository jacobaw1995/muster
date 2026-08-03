# MUSTER — Phase 2: Supabase backend (schema, RLS, storage, real data)

Phase 1 is complete and approved — all 8 screens work end-to-end on in-memory mock data via `SessionContext`. This is **Phase 2**: stand up a real Supabase backend and swap the mock reads/writes for real queries, WITHOUT changing the UI or the `SessionContext` public shape more than necessary. Real OAuth is still Phase 3 — this phase uses a client-generated guest id for attribution.

## Supabase project (create it in the RIGHT account)
- The connected Supabase account has exactly one org: **structteck** (`id: atutgdfktddukxabhrrj`) — the same org that holds the existing **structtech** (StructTech OS) project. **Create a NEW project here named `muster`.** Do NOT modify the existing `structtech`, `jared-walker-platform`, or `construction-pm-app` projects.
- After creation, put the project URL + anon (publishable) key in `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Add a committed `.env.example` with the var names (no secrets), and make sure `.env.local` is gitignored.
- Commit all schema as SQL migrations under `supabase/migrations/` (use the Supabase CLI / migration workflow so the schema is reproducible and version-controlled, not just applied ad hoc).
- Generate TypeScript types from the schema (`supabase gen types`) into `src/lib/database.types.ts` and use them in the client layer.

## Security posture (per director decision: open now, harden later)
- RLS **on** for every table, but policies are **permissive** this phase: anon (public) can `select` everything and `insert` events/rsvps/itinerary/impact. This matches the spec's open-access model (browse, RSVP, and create with no account). Do NOT gate writes behind auth this phase.
- Attribution uses a client-generated `guest_id` (UUID stored in localStorage), written as a plain data column — it is NOT a security boundary yet. Leave a clear `TODO(Phase 3)`: replace `guest_id` with the real `auth.uid()`, migrate guest rows to the account, and tighten RLS to per-owner. Anonymous Supabase auth sessions are the recommended Phase 3 migration path — note that in a comment.
- Anti-spam (rate limits, moderation, captcha) is explicitly deferred to Phase 4 — leave a note, don't build it.

## Schema (tables)
- **profiles** — `id uuid pk` (will map to `auth.uid()` in Phase 3), `name text`, `contact text`, `avatar_url text`, `created_at`. Mostly for Phase 3; create it now.
- **events** — mirror the `MusterEvent` type: `id uuid pk default gen_random_uuid()`, `title`, `category text` (built-in slug or custom string), `organizer`, `location`, `distance_mi numeric`, `date date`, `time text`, `duration_label text`, `cost text`, `capacity int null`, `going_count int`, `maybe_count int`, `attendees text[]`, `notes text`, `website text null`, `photo_url text null`, `map_x numeric`, `map_y numeric`, `created_by uuid null` (guest_id), `created_at`. (`distance_mi`/`map_x`/`map_y` stay mock/static for now — real geo is out of scope.)
- **rsvps** — `id uuid pk`, `event_id uuid fk → events`, `attendee_id uuid` (guest_id), `status text check (status in ('yes','maybe','no'))`, `created_at`, `unique(event_id, attendee_id)`.
- **itinerary_items** — `id uuid pk`, `event_id uuid fk → events`, `owner_id uuid` (guest_id), `created_at`, `unique(event_id, owner_id)`. (Explicit table because manual itinerary add is independent of RSVP per the spec.)
- **impact_logs** — `id uuid pk`, `event_id uuid fk → events`, `owner_id uuid` (guest_id), `bags int`, `miles numeric`, `people int`, `created_at`.
- **org_impact_totals** — a small seeded table holding the org-wide aggregate numbers for the two periods (`period text: '2026' | 'all_time'`, plus lbs_trash, miles_rucked, events_held, lives_impacted, active_members). Seed with the existing mock org numbers. (Spec says this view is computed/not user-editable; a seeded table is fine now — leave a TODO to later replace with a real aggregate view/materialized view over `impact_logs` + `events`.)

## Storage
- Create public-read buckets `event-photos` and `avatars`.
- Wire the Create-flow event photo (PhotoSlot) and the Settings avatar (PhotoSlot) to real uploads → set `photo_url` / `avatar_url` to the resulting public URL. Keep it graceful/optional (uploads can fail without blocking the flow). This is the lower-priority tail of the phase — if it balloons, flag it and leave the buckets + a clear TODO rather than half-wiring.

## Seed data
- Seed the `events` table with the existing mock events (from `src/lib/mockEvents.ts`) so the app looks populated on first load. Seed `org_impact_totals` with the current mock org numbers. Personal impact starts empty per user (no seed) — but keep the seeded non-zero personal starting totals behavior by writing them as the guest's initial impact baseline only if that's clean; otherwise it's fine for a brand-new guest to start at zero (note the change).

## Client / data layer
- Add `@supabase/supabase-js`; create `src/lib/supabase.ts` (typed client from env).
- Add a data-access layer (`src/lib/api/` or `src/data/`) with typed functions: `listEvents`, `getEvent`, `createEvent`, `setRsvp`/`clearRsvp`, `addItinerary`/`removeItinerary`, `listItinerary`, `logImpact`, `getPersonalImpact`, `getOrgImpact`.
- Refactor `SessionContext` to call this layer (async) instead of holding mock arrays — **keep its public API (the values/functions screens consume) as stable as possible** so screen components barely change. Add loading/error handling; the Map's already-built Loading and Empty states should now reflect real async fetches. Introduce a lightweight guest-id module (`src/lib/guestId.ts`) that lazily creates + persists the localStorage UUID.
- Keep the dev-only Map state switcher working (it can still force Loading/Empty visually), but real data should drive the default path.

## Constraints
- Do not restyle screens or change the design — this is a data-layer swap. Token-only styling stays intact; zero hardcoded hex.
- Don't touch `design_handoff_muster_events_app/`.
- Do NOT modify any existing Supabase project other than the new `muster` one.
- Keep `npm run build` and `npm run lint` clean. Secrets never committed.

## Definition of done
- A new `muster` Supabase project exists in the structteck org; schema applied via committed migrations; `database.types.ts` generated and used.
- `.env.local` wired (gitignored) + `.env.example` committed; `src/lib/supabase.ts` connects.
- All six tables created with RLS on and permissive policies; guest_id attribution working; clear Phase 3 TODOs on the RLS/attribution.
- The app runs against real data: Map lists seeded events (real async load), Event Detail loads by id, Create inserts a row that appears on Map, RSVP/itinerary/impact all persist to the DB and survive a page reload (the earlier in-memory limitation is gone).
- Org impact reads from `org_impact_totals`; personal impact reads/writes `impact_logs`.
- Storage buckets exist; event photo + avatar upload wired (or cleanly deferred with buckets + TODO if it over-ran).
- Build + lint clean; no secrets committed.

When done, summarize what you built (including the new project ref and the schema), note deviations/TODOs, and confirm the definition-of-done checklist for review before Phase 3 (real auth + guest→account migration).
