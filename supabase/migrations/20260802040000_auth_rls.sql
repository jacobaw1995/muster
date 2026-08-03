-- Phase 3: real auth. Every visitor now gets a genuine Supabase session —
-- permanent users AND anonymous ones (see src/state/SessionContext.tsx's
-- signInAnonymously() bootstrap) — so we can finally enforce per-owner RLS
-- instead of Phase 2's "anyone can write" policies.
--
-- Note: an anonymous-auth session's requests carry Postgres role
-- `authenticated` (not `anon`) and a real auth.uid() — `anon` here means "no
-- session at all," which our own client never produces once bootstrap
-- runs. Read policies stay public (`anon, authenticated`) unchanged.
--
-- Column defaults are set to auth.uid() so the client no longer needs to
-- pass owner columns on insert (see src/lib/api/*.ts) — the `with check`
-- clauses below are what actually enforce ownership; the defaults are just
-- a convenience that happens to always satisfy them.
--
-- Existing seeded events (created_by null) stay readable but become
-- uneditable by anyone (created_by = auth.uid() is never true for null) —
-- that's intentional, not a bug.
--
-- TODO(Phase 4): anti-spam (rate limits, moderation, captcha) is still
-- deferred — not addressed here.

-- profiles ---------------------------------------------------------------
alter table public.profiles alter column id set default auth.uid();

create policy "users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- events -------------------------------------------------------------
alter table public.events alter column created_by set default auth.uid();

drop policy "anyone can post an event" on public.events;

create policy "authenticated users can post an event as themselves"
  on public.events for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "owners can update their own event"
  on public.events for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "owners can delete their own event"
  on public.events for delete
  to authenticated
  using (created_by = auth.uid());

comment on column public.events.created_by is
  'auth.uid() of the poster (anonymous or permanent). Null for seeded rows — not editable by anyone.';

-- rsvps ----------------------------------------------------------------
alter table public.rsvps alter column attendee_id set default auth.uid();

drop policy "anyone can rsvp" on public.rsvps;
drop policy "anyone can change an rsvp" on public.rsvps;
drop policy "anyone can clear an rsvp" on public.rsvps;

create policy "users can rsvp as themselves"
  on public.rsvps for insert
  to authenticated
  with check (attendee_id = auth.uid());

create policy "users can change their own rsvp"
  on public.rsvps for update
  to authenticated
  using (attendee_id = auth.uid())
  with check (attendee_id = auth.uid());

create policy "users can clear their own rsvp"
  on public.rsvps for delete
  to authenticated
  using (attendee_id = auth.uid());

comment on column public.rsvps.attendee_id is 'auth.uid() of the attendee.';

-- itinerary_items --------------------------------------------------------
alter table public.itinerary_items alter column owner_id set default auth.uid();

drop policy "anyone can add an itinerary item" on public.itinerary_items;
drop policy "anyone can remove an itinerary item" on public.itinerary_items;

create policy "users can add their own itinerary item"
  on public.itinerary_items for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "users can remove their own itinerary item"
  on public.itinerary_items for delete
  to authenticated
  using (owner_id = auth.uid());

comment on column public.itinerary_items.owner_id is 'auth.uid() of the owner.';

-- impact_logs ------------------------------------------------------------
alter table public.impact_logs alter column owner_id set default auth.uid();

drop policy "anyone can log impact" on public.impact_logs;

create policy "users can log their own impact"
  on public.impact_logs for insert
  to authenticated
  with check (owner_id = auth.uid());

comment on column public.impact_logs.owner_id is 'auth.uid() of the person logging impact.';
