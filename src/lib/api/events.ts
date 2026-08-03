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
  cost: string;
  capacity: number | null;
  notes: string;
  website: string | null;
  photoUrl: string | null;
}

/**
 * Always inserts with going/maybe at 0 — the creator's own RSVP (if any) is
 * a real rsvps row inserted separately, so it flows through the same
 * live-count path as everyone else's. `created_by` isn't passed — it
 * defaults to auth.uid() (see the auth_rls migration), which is also what
 * the insert RLS policy checks against.
 */
export async function createEvent(input: NewEventInput): Promise<MusterEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      category: input.category,
      organizer: input.organizer,
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
      cost: input.cost,
      capacity: input.capacity,
      notes: input.notes,
      website: input.website,
      photo_url: input.photoUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return toMusterEvent(data, 0, 0);
}
