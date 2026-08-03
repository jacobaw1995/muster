-- MUSTER initial schema (Phase 2).
--
-- Attribution model: every user-owned row is keyed by a client-generated
-- `guest_id` (a UUID minted in localStorage — see src/lib/guestId.ts), NOT
-- auth.uid(). There is no real auth yet (Phase 3). RLS is ON for every
-- table, but policies are deliberately permissive per the Phase 2 director
-- decision: "open now, harden later" — this matches the product's
-- open-access model (browse/RSVP/create with no account required).
--
-- TODO(Phase 3): replace guest_id attribution with real auth.uid() (via
-- Supabase anonymous auth sessions as the migration path — a session
-- upgrades in place from anonymous to a real identity without changing the
-- user's id, so existing guest-owned rows keep working), migrate existing
-- guest rows to the authenticated account, and tighten RLS to per-owner
-- (`using (owner_id = auth.uid())` etc.) instead of `using (true)`.
--
-- TODO(Phase 4): anti-spam (rate limits, moderation, captcha) is explicitly
-- deferred — not addressed here.

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- Mostly for Phase 3 (auth.uid() will become the primary key then) — the
-- table exists now so later phases don't need a schema migration just to
-- add it. Nothing in Phase 2's app code writes to this table yet.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text,
  contact text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  organizer text not null,
  location text not null,
  distance_mi numeric not null default 0,
  date date not null,
  time text not null,
  duration_label text not null,
  cost text not null default 'FREE',
  capacity int,
  going_count int not null default 0,
  maybe_count int not null default 0,
  attendees text[] not null default '{}',
  notes text not null default '',
  website text,
  photo_url text,
  map_x numeric not null default 50,
  map_y numeric not null default 50,
  created_by uuid,
  created_at timestamptz not null default now()
);

comment on column public.events.going_count is
  'Seeded/base going count. The *displayed* total is this plus a live count of real rsvps rows (status=''yes''), computed client-side — see src/lib/api/events.ts. Never mutated directly by the client.';
comment on column public.events.maybe_count is
  'Seeded/base maybe count — same live-delta pattern as going_count.';
comment on column public.events.created_by is
  'Client-generated guest_id of the poster. TODO(Phase 3): auth.uid().';

alter table public.events enable row level security;

create policy "events are publicly readable"
  on public.events for select
  to anon, authenticated
  using (true);

create policy "anyone can post an event"
  on public.events for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------
-- rsvps
-- ---------------------------------------------------------------------
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  attendee_id uuid not null,
  status text not null check (status in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now(),
  unique (event_id, attendee_id)
);

comment on column public.rsvps.attendee_id is
  'Client-generated guest_id. TODO(Phase 3): auth.uid().';

create index rsvps_event_id_idx on public.rsvps (event_id);

alter table public.rsvps enable row level security;

create policy "rsvps are publicly readable"
  on public.rsvps for select
  to anon, authenticated
  using (true);

create policy "anyone can rsvp"
  on public.rsvps for insert
  to anon, authenticated
  with check (true);

create policy "anyone can change an rsvp"
  on public.rsvps for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "anyone can clear an rsvp"
  on public.rsvps for delete
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- itinerary_items
-- ---------------------------------------------------------------------
-- A separate table (not derived from rsvps) because the manual
-- "Add/Remove from itinerary" action is independent of RSVP status per the
-- design spec — tapping RSVP "yes" auto-adds here, but un-RSVPing does not
-- auto-remove, and a user can add an itinerary item without RSVPing yes.
create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  owner_id uuid not null,
  created_at timestamptz not null default now(),
  unique (event_id, owner_id)
);

comment on column public.itinerary_items.owner_id is
  'Client-generated guest_id. TODO(Phase 3): auth.uid().';

create index itinerary_items_owner_id_idx on public.itinerary_items (owner_id);

alter table public.itinerary_items enable row level security;

create policy "itinerary items are publicly readable"
  on public.itinerary_items for select
  to anon, authenticated
  using (true);

create policy "anyone can add an itinerary item"
  on public.itinerary_items for insert
  to anon, authenticated
  with check (true);

create policy "anyone can remove an itinerary item"
  on public.itinerary_items for delete
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- impact_logs
-- ---------------------------------------------------------------------
-- Append-only self-reported log entries, always tied to a specific event.
-- Personal totals (bags/miles/people/events-showed-up) are computed by
-- summing a guest's own rows at read time, not stored separately.
create table public.impact_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  owner_id uuid not null,
  bags int not null default 0,
  miles numeric not null default 0,
  people int not null default 0,
  created_at timestamptz not null default now()
);

comment on column public.impact_logs.owner_id is
  'Client-generated guest_id. TODO(Phase 3): auth.uid().';

create index impact_logs_owner_id_idx on public.impact_logs (owner_id);

alter table public.impact_logs enable row level security;

create policy "impact logs are publicly readable"
  on public.impact_logs for select
  to anon, authenticated
  using (true);

create policy "anyone can log impact"
  on public.impact_logs for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------
-- org_impact_totals
-- ---------------------------------------------------------------------
-- Aggregate/community numbers for the Impact screen's "OPERATOR STANDARD"
-- view. Explicitly not user-editable per the design spec — seeded once via
-- migration (below), no insert/update/delete policy for anon or
-- authenticated. TODO: replace with a real aggregate view/materialized
-- view over impact_logs + events once there's enough real activity to
-- compute genuine org-wide numbers from.
create table public.org_impact_totals (
  period text primary key check (period in ('2026', 'all_time')),
  lbs_trash int not null,
  miles_rucked int not null,
  events_held int not null,
  lives_impacted int not null,
  active_members int not null
);

alter table public.org_impact_totals enable row level security;

create policy "org impact totals are publicly readable"
  on public.org_impact_totals for select
  to anon, authenticated
  using (true);
