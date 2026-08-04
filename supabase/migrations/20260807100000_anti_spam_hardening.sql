-- Phase 14: anti-spam hardening.
--
-- Turnstile verification and the "counted query" side of rate limiting
-- live in the new create-event Edge Function (application-layer, good UX —
-- fails fast before Turnstile/geocode work). Everything here is the
-- unconditional DB-layer backstop: even a client that bypasses the Edge
-- Function and inserts directly via PostgREST with a valid JWT still hits
-- these triggers/constraints. Thresholds are deliberately generous —
-- they're anti-bot backstops, not real-usage limiters.

-- ---------------------------------------------------------------------
-- events: ip_address (for rate limiting) + hidden (for moderation)
-- ---------------------------------------------------------------------
alter table public.events
  add column ip_address inet,
  add column hidden boolean not null default false;

comment on column public.events.ip_address is
  'Best-effort client IP captured by the create-event Edge Function (x-forwarded-for) — used for IP-based rate limiting alongside created_by. Null for events inserted before Phase 14 or if the header was unavailable.';
comment on column public.events.hidden is
  'Set true by auto_hide_reported_event() once an event accumulates enough distinct reports (see the reports table below). Pending-review, not deleted — excluded from public reads via the SELECT policy below, but the creator can still see/edit their own. No admin UI yet (Phase 14) — the director reviews/restores via the Supabase dashboard, see SETUP.md.';

-- Tighten the public SELECT policy to exclude hidden events, except for
-- their own creator (who should still see/edit a flagged-pending-review
-- event). Un-hiding is deliberately NOT exposed through the normal update
-- path (UpdateEventInput never includes `hidden`) — only the auto-hide
-- trigger or a manual dashboard edit can change it, so a creator can't
-- just re-save their way out of moderation.
drop policy "events are publicly readable" on public.events;

create policy "events are publicly readable unless hidden"
  on public.events for select
  to anon, authenticated
  using (not hidden or created_by = auth.uid());

-- ---------------------------------------------------------------------
-- Content caps + URL validation (Part C)
-- ---------------------------------------------------------------------
-- trim-aware on title so a whitespace-only string can't sneak past a bare
-- char_length check; notes/location/street/city/state/zip just cap length
-- (empty is legitimate for the optional ones). website must be a real
-- http(s) URL — rejects javascript:/data:/mailto: etc. by construction
-- (they don't match the ^https?:// prefix).
alter table public.events
  add constraint events_title_length
    check (char_length(trim(title)) between 1 and 120),
  add constraint events_notes_length
    check (char_length(notes) <= 2000),
  add constraint events_location_length
    check (location is null or char_length(location) <= 200),
  add constraint events_street_length
    check (street is null or char_length(street) <= 200),
  add constraint events_city_length
    check (char_length(city) <= 100),
  add constraint events_state_length
    check (char_length(state) <= 50),
  add constraint events_zip_length
    check (zip is null or char_length(zip) <= 20),
  add constraint events_website_format
    check (website is null or website ~* '^https?://\S+$');

-- ---------------------------------------------------------------------
-- events rate-limit trigger (Part B) — the DB-level backstop behind the
-- create-event Edge Function's own uid+IP pre-check.
-- ---------------------------------------------------------------------
create or replace function public.enforce_event_rate_limit()
returns trigger
language plpgsql
as $$
declare
  v_uid_hour int;
  v_uid_day int;
  v_ip_hour int;
  v_ip_day int;
begin
  select count(*) into v_uid_hour from public.events
    where created_by = NEW.created_by and created_at > now() - interval '1 hour';
  select count(*) into v_uid_day from public.events
    where created_by = NEW.created_by and created_at > now() - interval '1 day';
  if v_uid_hour >= 5 or v_uid_day >= 20 then
    raise exception 'You''re posting events too quickly — try again later.' using errcode = 'P0001';
  end if;

  if NEW.ip_address is not null then
    select count(*) into v_ip_hour from public.events
      where ip_address = NEW.ip_address and created_at > now() - interval '1 hour';
    select count(*) into v_ip_day from public.events
      where ip_address = NEW.ip_address and created_at > now() - interval '1 day';
    if v_ip_hour >= 10 or v_ip_day >= 40 then
      raise exception 'Too many events posted from this network — try again later.' using errcode = 'P0001';
    end if;
  end if;

  return NEW;
end;
$$;

create trigger events_rate_limit
  before insert on public.events
  for each row execute function public.enforce_event_rate_limit();

-- ---------------------------------------------------------------------
-- rsvps: capacity enforcement (Part D) + rate limit (Part B)
-- ---------------------------------------------------------------------
-- Only checked on a *transition into* 'yes' — a fresh insert with
-- status='yes', or an update from a non-yes status. Re-saving an already-
-- 'yes' row (e.g. a no-op) never re-triggers this, so existing yes-RSVP
-- holders are never bumped by others joining after them, matching the
-- "existing YES holders unaffected" requirement. capacity is recomputed
-- from the DB (base going_count + live 'yes' rows, excluding the caller's
-- own), never trusted from the client.
create or replace function public.enforce_rsvp_capacity()
returns trigger
language plpgsql
as $$
declare
  v_capacity int;
  v_base int;
  v_other_yes int;
begin
  if NEW.status = 'yes' and (TG_OP = 'INSERT' or OLD.status is distinct from 'yes') then
    select capacity, going_count into v_capacity, v_base
      from public.events where id = NEW.event_id;
    if v_capacity is not null then
      select count(*) into v_other_yes from public.rsvps
        where event_id = NEW.event_id and status = 'yes' and attendee_id <> NEW.attendee_id;
      if v_base + v_other_yes >= v_capacity then
        raise exception 'This event is at capacity.' using errcode = 'P0001';
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

create trigger rsvps_enforce_capacity
  before insert or update on public.rsvps
  for each row execute function public.enforce_rsvp_capacity();

create or replace function public.enforce_rsvp_rate_limit()
returns trigger
language plpgsql
as $$
declare
  v_recent int;
begin
  select count(*) into v_recent from public.rsvps
    where attendee_id = NEW.attendee_id and created_at > now() - interval '1 hour';
  if v_recent >= 100 then
    raise exception 'Too many RSVPs — try again later.' using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

-- INSERT only — toggling an existing RSVP is an UPDATE (see setRsvp's
-- upsert onConflict), so repeatedly changing your mind about ONE event
-- never counts against this; it only bounds genuinely new distinct rows.
create trigger rsvps_rate_limit
  before insert on public.rsvps
  for each row execute function public.enforce_rsvp_rate_limit();

-- ---------------------------------------------------------------------
-- impact_logs: rate limit (Part B) — append-only, so every log is a new
-- row (no upsert to exempt like rsvps above).
-- ---------------------------------------------------------------------
create or replace function public.enforce_impact_log_rate_limit()
returns trigger
language plpgsql
as $$
declare
  v_recent int;
begin
  select count(*) into v_recent from public.impact_logs
    where owner_id = NEW.owner_id and created_at > now() - interval '1 hour';
  if v_recent >= 50 then
    raise exception 'Too many impact logs — try again later.' using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

create trigger impact_logs_rate_limit
  before insert on public.impact_logs
  for each row execute function public.enforce_impact_log_rate_limit();

-- ---------------------------------------------------------------------
-- reports + auto-hide (Part E)
-- ---------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  reporter_id uuid not null default auth.uid(),
  reason text not null check (char_length(reason) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (event_id, reporter_id)
);

comment on table public.reports is
  'One row per (event, reporter) — the unique constraint is what makes "report" idempotent per user (a second attempt hits a unique-violation, which the client shows as "already reported"). No SELECT policy for anon/authenticated: reports are reviewed via the Supabase dashboard only (service_role), no admin UI this phase — see SETUP.md.';

create index reports_event_id_idx on public.reports (event_id);

alter table public.reports enable row level security;

create policy "users can report an event as themselves"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- SECURITY DEFINER: flips a *different* user's event.hidden, which the
-- reporter's own RLS (owners-only update) would never allow directly —
-- this is the one deliberate, narrow exception, scoped to exactly this
-- trigger rather than loosening events' UPDATE policy itself.
create or replace function public.auto_hide_reported_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_distinct_reporters int;
begin
  select count(distinct reporter_id) into v_distinct_reporters
    from public.reports where event_id = NEW.event_id;
  if v_distinct_reporters >= 3 then
    update public.events set hidden = true
      where id = NEW.event_id and hidden = false;
  end if;
  return NEW;
end;
$$;

create trigger reports_auto_hide
  after insert on public.reports
  for each row execute function public.auto_hide_reported_event();
