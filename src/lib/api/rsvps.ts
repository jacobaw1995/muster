import { supabase } from "../supabase";
import type { RsvpStatus } from "../mockEvents";

export async function listRsvpsForUser(
  userId: string,
): Promise<Record<string, Exclude<RsvpStatus, null>>> {
  const { data, error } = await supabase
    .from("rsvps")
    .select("event_id, status")
    .eq("attendee_id", userId);
  if (error) throw error;

  const map: Record<string, Exclude<RsvpStatus, null>> = {};
  for (const row of data ?? []) {
    map[row.event_id] = row.status as Exclude<RsvpStatus, null>;
  }
  return map;
}

/** `attendee_id` defaults to auth.uid() (see the auth_rls migration) — not passed here. */
export async function setRsvp(
  eventId: string,
  status: Exclude<RsvpStatus, null>,
): Promise<void> {
  const { error } = await supabase
    .from("rsvps")
    .upsert({ event_id: eventId, status }, { onConflict: "event_id,attendee_id" });
  if (error) throw error;
}

/** No attendee filter needed — RLS restricts deletes to the caller's own row. */
export async function clearRsvp(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("event_id", eventId);
  if (error) throw error;
}
