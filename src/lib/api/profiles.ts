import { supabase } from "../supabase";

export interface Profile {
  id: string;
  name: string | null;
  contact: string | null;
  avatarUrl: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    contact: data.contact,
    avatarUrl: data.avatar_url,
  };
}

/** Partial upsert for the caller's own row — `id` defaults to auth.uid() (see the auth_rls migration), so it's never passed explicitly. Omitted fields are left untouched on conflict. */
export async function upsertProfile(patch: {
  name?: string;
  contact?: string;
  avatarUrl?: string;
}): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      { name: patch.name, contact: patch.contact, avatar_url: patch.avatarUrl },
      { onConflict: "id" },
    )
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    contact: data.contact,
    avatarUrl: data.avatar_url,
  };
}
