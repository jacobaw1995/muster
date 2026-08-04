-- Phase 13: email notifications (event reminders + new-events-nearby).
--
-- Two Edge Functions (send-event-reminders, send-nearby-events) are
-- invoked by pg_cron below and do the actual sending via Resend. This
-- migration only adds the schema they read/write and the schedules that
-- trigger them.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------
-- profiles: notification prefs + home location
-- ---------------------------------------------------------------------
alter table public.profiles
  add column event_reminders boolean not null default true,
  add column new_events_nearby boolean not null default true,
  add column home_city text,
  add column home_state text,
  add column home_zip text,
  add column home_lat numeric,
  add column home_lng numeric;

comment on column public.profiles.event_reminders is
  'Opt-in for evening-before/morning-of reminder emails about the user''s yes-RSVPd events (Phase 13). Mirrors the Settings "Event reminders" toggle.';
comment on column public.profiles.new_events_nearby is
  'Opt-in for new-events-near-home-location digest emails (Phase 13). Mirrors the Settings "New events near me" toggle.';
comment on column public.profiles.home_city is
  'Home location set in Settings, geocoded via the geocode Edge Function — what "new events nearby" emails match against (see home_lat/home_lng). Distinct from userLocation (live device geolocation), which is session-only and never persisted.';
comment on column public.profiles.home_lat is
  'Geocoded from home_city/home_state/home_zip. Null until the user sets a home location — send-nearby-events skips users with no home_lat/home_lng regardless of their new_events_nearby preference.';
comment on column public.profiles.home_lng is 'See home_lat.';

-- Home location is meaningfully more sensitive than name/avatar — tighten
-- the original Phase 2 "publicly readable" policy (a vestige of profiles
-- once being more social-facing; nothing in the app actually reads another
-- user's profile — getProfile() is only ever called with the caller's own
-- uid, see src/state/SessionContext.tsx) to owner-only.
drop policy "profiles are publicly readable" on public.profiles;

create policy "users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------
-- notifications_sent
-- ---------------------------------------------------------------------
-- De-dupe ledger so a reminder or nearby-digest email never double-sends.
-- 'reminder_evening' and 'reminder_morning' are distinct kinds (both fire
-- once per event, one evening-before and one morning-of); 'nearby' fires
-- once per (user, event) regardless of how many hourly sweeps see it.
create table public.notifications_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_id uuid not null references public.events (id) on delete cascade,
  kind text not null check (kind in ('reminder_evening', 'reminder_morning', 'nearby')),
  sent_at timestamptz not null default now(),
  unique (user_id, event_id, kind)
);

comment on table public.notifications_sent is
  'Write-only ledger from the send-event-reminders/send-nearby-events Edge Functions (service-role only — see RLS below). The unique constraint IS the de-dupe mechanism: a sender inserts optimistically and treats a unique-violation as "already sent, skip" rather than pre-checking with a select.';

create index notifications_sent_user_id_idx on public.notifications_sent (user_id);
create index notifications_sent_event_id_idx on public.notifications_sent (event_id);

alter table public.notifications_sent enable row level security;
-- Deliberately no policies for anon/authenticated — this table is
-- invisible to every client. Only the service-role key (used inside the
-- two Edge Functions, which bypasses RLS entirely) can read or write it.

-- ---------------------------------------------------------------------
-- haversine_miles
-- ---------------------------------------------------------------------
-- Great-circle distance in miles — mirrors src/lib/distance.ts's
-- client-side formula exactly (same 3958.8mi Earth radius) so "nearby"
-- means the same thing server-side as it does in the map's own radius
-- filter.
create or replace function public.haversine_miles(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
)
returns numeric
language sql
immutable
parallel safe
as $$
  select 3958.8 * 2 * asin(
    sqrt(
      sin(radians(lat2 - lat1) / 2) ^ 2
      + cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2
    )
  )
$$;

-- ---------------------------------------------------------------------
-- pg_cron schedules
-- ---------------------------------------------------------------------
-- Both Edge Functions are deployed with verify_jwt=false (server-to-server
-- calls from pg_cron, no end-user JWT to present) — the anon key in the
-- Authorization header below just satisfies the API gateway, it's not an
-- auth check. Safe to embed: it's the same public key already shipped in
-- the client bundle, protected by RLS rather than secrecy.
--
-- Times are fixed UTC offsets for US/Mountain Daylight Time (UTC-6,
-- roughly Mar-Nov, matching the seed region and today's date). During
-- Standard Time (UTC-7, Nov-Mar) these fire about an hour later than the
-- nominal 6pm/8am local — an accepted simplification per the director's
-- brief; true per-user timezone handling is a future refinement.

select cron.schedule(
  'muster-reminders-evening',
  '0 0 * * *', -- 00:00 UTC = 6:00 PM MDT — tomorrow's yes-RSVPd events
  $$
  select net.http_post(
    url := 'https://tqivrtrlnwuaxhzjklaz.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaXZydHJsbnd1YXhoemprbGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2Mjg1NzMsImV4cCI6MjEwMTIwNDU3M30.lK6u4Qf6H1o5I9yBR5tuLQ5vbzVpmllHMBsx2n02u8o'
    ),
    body := jsonb_build_object('kind', 'evening'),
    timeout_milliseconds := 60000
  );
  $$
);

select cron.schedule(
  'muster-reminders-morning',
  '0 14 * * *', -- 14:00 UTC = 8:00 AM MDT — today's yes-RSVPd events
  $$
  select net.http_post(
    url := 'https://tqivrtrlnwuaxhzjklaz.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaXZydHJsbnd1YXhoemprbGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2Mjg1NzMsImV4cCI6MjEwMTIwNDU3M30.lK6u4Qf6H1o5I9yBR5tuLQ5vbzVpmllHMBsx2n02u8o'
    ),
    body := jsonb_build_object('kind', 'morning'),
    timeout_milliseconds := 60000
  );
  $$
);

select cron.schedule(
  'muster-nearby-events',
  '0 * * * *', -- hourly, top of the hour
  $$
  select net.http_post(
    url := 'https://tqivrtrlnwuaxhzjklaz.supabase.co/functions/v1/send-nearby-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaXZydHJsbnd1YXhoemprbGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2Mjg1NzMsImV4cCI6MjEwMTIwNDU3M30.lK6u4Qf6H1o5I9yBR5tuLQ5vbzVpmllHMBsx2n02u8o'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
