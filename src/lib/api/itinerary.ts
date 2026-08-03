import { supabase } from "../supabase";

export async function listItinerary(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("itinerary_items")
    .select("event_id")
    .eq("owner_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.event_id);
}

/** `owner_id` defaults to auth.uid() (see the auth_rls migration) — not passed here. */
export async function addItinerary(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("itinerary_items")
    .upsert({ event_id: eventId }, { onConflict: "event_id,owner_id" });
  if (error) throw error;
}

/** No owner filter needed — RLS restricts deletes to the caller's own row. */
export async function removeItinerary(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("event_id", eventId);
  if (error) throw error;
}
