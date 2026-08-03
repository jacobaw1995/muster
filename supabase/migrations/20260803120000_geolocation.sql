-- Phase 7: real geolocation. Replaces the fake map_x/map_y percentages and
-- static distance_mi with real coordinates + a structured address, so "near
-- me" can be computed with an actual haversine distance instead of a
-- hand-picked number. map_x/map_y/distance_mi are left in place (unused
-- going forward, still have defaults) rather than dropped — no code reads
-- them after this phase, but there's no reason to force a column-drop
-- migration for columns that cost nothing sitting idle.
--
-- Venue name (`location`) becomes optional in the Create flow — City/State
-- are now the required fields instead — so its NOT NULL constraint is
-- relaxed to match.

alter table public.events
  add column street text,
  add column city text,
  add column state text,
  add column zip text,
  add column latitude numeric,
  add column longitude numeric;

alter table public.events
  alter column location drop not null;

-- Backfill the 10 seeded events with real coordinates (Colorado Front
-- Range) so the fictional "Basin County" cluster has something genuine to
-- compute real distances against. Matched by title since the seed
-- migration didn't pin ids.
update public.events set city = 'Golden', state = 'CO', latitude = 39.7455, longitude = -105.2211 where title = 'Sunrise Ruck: Basin Loop';
update public.events set city = 'Golden', state = 'CO', latitude = 39.7692, longitude = -105.2044 where title = 'Founders Green Cleanup';
update public.events set city = 'Golden', state = 'CO', latitude = 39.7561, longitude = -105.2246 where title = 'Ironclad Strength Session';
update public.events set city = 'Golden', state = 'CO', latitude = 39.7825, longitude = -105.1892 where title = 'Land Nav Fundamentals';
update public.events set city = 'Golden', state = 'CO', latitude = 39.7488, longitude = -105.2244 where title = 'Porchlight Sessions: Live Acoustic';
update public.events set city = 'Golden', state = 'CO', latitude = 39.7509, longitude = -105.2278 where title = 'Members Social & Cookout';
update public.events set city = 'Golden', state = 'CO', latitude = 39.7455, longitude = -105.2211 where title = 'Night Ruck: 10-Miler';
update public.events set city = 'Golden', state = 'CO', latitude = 39.7825, longitude = -105.1892 where title = 'Trailhead Yoga & Mobility';
update public.events set city = 'Morrison', state = 'CO', latitude = 39.6944, longitude = -105.1936 where title = 'Overwatch Airsoft Skirmish';
update public.events set city = 'Loveland', state = 'CO', latitude = 40.1672, longitude = -105.4234 where title = 'Basin County Cleanup: River Bend';

-- Any event without a backfilled city/state at this point isn't one of the
-- 10 known seed rows (shouldn't happen, but don't let a not-null migration
-- below crash on a genuine surprise row) — fall back to the same Golden, CO
-- anchor point.
update public.events set city = 'Golden', state = 'CO', latitude = 39.7555, longitude = -105.2211
where city is null or state is null;

alter table public.events
  alter column city set not null,
  alter column state set not null;

comment on column public.events.location is
  'Optional venue/label (e.g. "Basin Park trailhead") — city/state are the required geocoding fields, this is just display copy.';
comment on column public.events.latitude is
  'Geocoded via the geocode Edge Function (Nominatim) at creation time. Null if geocoding failed — the event still posts, it just has no map pin or real distance until re-geocoded.';
comment on column public.events.longitude is 'See latitude.';

-- ---------------------------------------------------------------------
-- geocode_cache
-- ---------------------------------------------------------------------
-- Keyed by a normalized address string so repeat lookups (same venue used
-- by multiple events, or the same city typed slightly differently) don't
-- re-hit Nominatim — required by its usage policy as much as it is by
-- performance. Public read/insert, no owner attribution: this is
-- non-sensitive shared reference data, same "open" model as the rest of
-- the app's public-read tables.
create table public.geocode_cache (
  id uuid primary key default gen_random_uuid(),
  normalized_address text not null unique,
  lat numeric not null,
  lng numeric not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.geocode_cache enable row level security;

create policy "geocode cache is publicly readable"
  on public.geocode_cache for select
  to anon, authenticated
  using (true);

create policy "anyone can populate the geocode cache"
  on public.geocode_cache for insert
  to anon, authenticated
  with check (true);
