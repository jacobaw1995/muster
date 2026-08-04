import { supabase } from "../supabase";
import type { MusterEvent } from "../mockEvents";
import type { Tables } from "../database.types";

type EventRow = Tables<"events">;

/**
 * `going_count`/`maybe_count` on the row are seed/base numbers. The live
 * displayed total adds real rsvps — excluding the current user's own row,
 * since the unchanged client-side `withRsvpCounts()` already adds their
 * own +1 on top of what this returns.
 */
function toMusterEvent(
  row: EventRow,
  liveGoing: number,
  liveMaybe: number,
): MusterEvent {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    organizer: row.organizer,
    createdBy: row.created_by,
    location: row.location,
    street: row.street,
    city: row.city,
    state: row.state,
    zip: row.zip,
    latitude: row.latitude,
    longitude: row.longitude,
    date: row.date,
    time: row.time,
    durationLabel: row.duration_label,
    durationMinutes: row.duration_minutes,
    cost: row.cost,
    capacity: row.capacity,
    goingCount: row.going_count + liveGoing,
    maybeCount: row.maybe_count + liveMaybe,
    attendees: row.attendees,
    notes: row.notes,
    website: row.website,
    photoUrl: row.photo_url,
  };
}

function tallyRsvps(
  rsvps: { event_id: string; attendee_id: string; status: string }[],
  excludeUserId: string,
) {
  const counts = new Map<string, { going: number; maybe: number }>();
  for (const r of rsvps) {
    if (r.attendee_id === excludeUserId) continue;
    const c = counts.get(r.event_id) ?? { going: 0, maybe: 0 };
    if (r.status === "yes") c.going += 1;
    else if (r.status === "maybe") c.maybe += 1;
    counts.set(r.event_id, c);
  }
  return counts;
}

export async function listEvents(userId: string): Promise<MusterEvent[]> {
  const [eventsRes, rsvpsRes] = await Promise.all([
    supabase.from("events").select("*").order("date", { ascending: true }),
    supabase.from("rsvps").select("event_id, attendee_id, status"),
  ]);
  if (eventsRes.error) throw eventsRes.error;
  if (rsvpsRes.error) throw rsvpsRes.error;

  const counts = tallyRsvps(rsvpsRes.data ?? [], userId);
  return (eventsRes.data ?? []).map((row) => {
    const c = counts.get(row.id) ?? { going: 0, maybe: 0 };
    return toMusterEvent(row, c.going, c.maybe);
  });
}

export async function getEvent(
  id: string,
  userId: string,
): Promise<MusterEvent | null> {
  const [eventRes, rsvpsRes] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    supabase.from("rsvps").select("event_id, attendee_id, status").eq("event_id", id),
  ]);
  if (eventRes.error) throw eventRes.error;
  if (rsvpsRes.error) throw rsvpsRes.error;
  if (!eventRes.data) return null;

  const counts = tallyRsvps(rsvpsRes.data ?? [], userId);
  const c = counts.get(id) ?? { going: 0, maybe: 0 };
  return toMusterEvent(eventRes.data, c.going, c.maybe);
}

export interface NewEventInput {
  title: string;
  category: string;
  organizer: string;
  /** Optional venue/label — city/state are the fields that actually get geocoded. */
  location: string | null;
  street: string | null;
  city: string;
  state: string;
  zip: string | null;
  /** Result of geocoding city/state(/street/zip) via the `geocode` Edge Function — null if that failed, which never blocks posting. */
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
  durationLabel: string;
  /** Null for "All day" and "TBD / by ear" — see MusterEvent.durationMinutes. */
  durationMinutes: number | null;
  cost: string;
  capacity: number | null;
  notes: string;
  website: string | null;
  photoUrl: string | null;
}

/**
 * Routed through the create-event Edge Function (Phase 14), not a direct
 * table insert — it verifies the Turnstile token server-side and captures
 * the caller's IP for rate limiting before inserting. The function runs
 * the actual insert with the caller's own forwarded JWT, so `created_by`
 * still defaults to auth.uid() and the existing per-owner RLS policy still
 * applies unchanged; this is a gate in front of that policy, not a
 * replacement for it. Always inserts with going/maybe at 0 — the
 * creator's own RSVP (if any) is a real rsvps row inserted separately, so
 * it flows through the same live-count path as everyone else's.
 *
 * `turnstileToken` is null when VITE_TURNSTILE_SITE_KEY isn't configured
 * (see components/Turnstile.tsx) — the Edge Function degrades the same
 * way when its own secret is unset, so this never blocks local dev.
 */
export async function createEvent(
  input: NewEventInput,
  turnstileToken: string | null,
): Promise<MusterEvent> {
  const { data, error } = await supabase.functions.invoke("create-event", {
    body: { ...input, turnstileToken },
  });
  if (error) throw error;
  if (!data?.ok) {
    throw new Error(data?.error ?? "Couldn't post your event — try again");
  }
  return toMusterEvent(data.event, 0, 0);
}

/**
 * Editable fields for an existing event (Phase 10) — deliberately excludes
 * `organizer` (never exposed as an editable field anywhere in the UI) and
 * `created_by` (ownership never changes). RLS's "owners can update their
 * own event" policy (created_by = auth.uid()) is what actually enforces
 * this is only callable by the creator — the UI just doesn't show the
 * controls to anyone else.
 */
export type UpdateEventInput = Omit<NewEventInput, "organizer">;

/**
 * Updates in place — never creates a new row. Returns the fresh row via
 * toMusterEvent(..., 0, 0); the going/maybe live-count deltas are zeroed
 * here because this function has no rsvps context of its own — callers
 * (see SessionContext.updateEvent) merge the *existing* live-merged
 * goingCount/maybeCount back on top, since an edit never touches RSVPs.
 */
export async function updateEvent(
  id: string,
  input: UpdateEventInput,
): Promise<MusterEvent> {
  const { data, error } = await supabase
    .from("events")
    .update({
      title: input.title,
      category: input.category,
      location: input.location,
      street: input.street,
      city: input.city,
      state: input.state,
      zip: input.zip,
      latitude: input.latitude,
      longitude: input.longitude,
      date: input.date,
      time: input.time,
      duration_label: input.durationLabel,
      duration_minutes: input.durationMinutes,
      cost: input.cost,
      capacity: input.capacity,
      notes: input.notes,
      website: input.website,
      photo_url: input.photoUrl,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toMusterEvent(data, 0, 0);
}

/** RLS ("owners can delete their own event") is what actually enforces ownership — rsvps/itinerary_items/impact_logs all reference events with ON DELETE CASCADE, so this cleanly removes an event's child rows too (see the initial_schema migration). */
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
