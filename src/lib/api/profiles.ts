import { supabase } from "../supabase";

export interface Profile {
  id: string;
  name: string | null;
  contact: string | null;
  avatarUrl: string | null;
  eventReminders: boolean;
  newEventsNearby: boolean;
  homeCity: string | null;
  homeState: string | null;
  homeZip: string | null;
  homeLat: number | null;
  homeLng: number | null;
}

function toProfile(data: {
  id: string;
  name: string | null;
  contact: string | null;
  avatar_url: string | null;
  event_reminders: boolean;
  new_events_nearby: boolean;
  home_city: string | null;
  home_state: string | null;
  home_zip: string | null;
  home_lat: number | null;
  home_lng: number | null;
}): Profile {
  return {
    id: data.id,
    name: data.name,
    contact: data.contact,
    avatarUrl: data.avatar_url,
    eventReminders: data.event_reminders,
    newEventsNearby: data.new_events_nearby,
    homeCity: data.home_city,
    homeState: data.home_state,
    homeZip: data.home_zip,
    homeLat: data.home_lat,
    homeLng: data.home_lng,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toProfile(data);
}

/** Partial upsert for the caller's own row — `id` defaults to auth.uid() (see the auth_rls migration), so it's never passed explicitly. Omitted fields are left untouched on conflict (a JS `undefined` value drops the key entirely when supabase-js serializes the request body, rather than writing an explicit null). */
export async function upsertProfile(patch: {
  name?: string;
  contact?: string;
  avatarUrl?: string;
  eventReminders?: boolean;
  newEventsNearby?: boolean;
  homeCity?: string | null;
  homeState?: string | null;
  homeZip?: string | null;
  homeLat?: number | null;
  homeLng?: number | null;
}): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        name: patch.name,
        contact: patch.contact,
        avatar_url: patch.avatarUrl,
        event_reminders: patch.eventReminders,
        new_events_nearby: patch.newEventsNearby,
        home_city: patch.homeCity,
        home_state: patch.homeState,
        home_zip: patch.homeZip,
        home_lat: patch.homeLat,
        home_lng: patch.homeLng,
      },
      { onConflict: "id" },
    )
    .select()
    .single();
  if (error) throw error;
  return toProfile(data);
}
