-- Phase 9: flexible event duration + impact relabel.
--
-- duration_label stays the human-readable display text ("1.5 hours",
-- "All day", "TBD / by ear") — duration_minutes is the numeric field
-- calendar math (ICS export, Google Calendar deep link) actually uses, so a
-- half-hour or 12-hour event computes a correct end time instead of being
-- squeezed into one of a handful of fixed presets. Null for "All day"
-- (handled as a full 24h span by duration_label alone) and "TBD / by ear"
-- (no fixed end — see src/lib/calendar.ts's fallback).
alter table public.events add column duration_minutes int;

-- Backfill the 10 seeded rows from their existing "N hour(s)" labels so
-- calendar math for them doesn't regress now that the app no longer
-- text-parses duration_label at read time. "All day" rows are left null on
-- purpose — that path is driven by duration_label, not duration_minutes.
update public.events
set duration_minutes = (regexp_match(duration_label, '^(\d+)'))[1]::int * 60
where duration_minutes is null
  and duration_label ~* '^\d+\s*hours?$';

comment on column public.events.duration_minutes is
  'Numeric duration for calendar math (ICS/Google Calendar end time). Null for "All day" (a full-day event, driven by duration_label instead) and "TBD / by ear" (no fixed end — see lib/calendar.ts).';

-- "Bags of Trash" everywhere, not "lbs" — the personal dashboard and the
-- log-impact sheet already said bags; the org dashboard's column/label were
-- the odd one out.
alter table public.org_impact_totals rename column lbs_trash to bags_trash;
