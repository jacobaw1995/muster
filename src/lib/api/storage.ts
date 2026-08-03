import { supabase } from "../supabase";

async function uploadToBucket(
  bucket: "event-photos" | "avatars",
  file: File,
  ownerId: string,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function uploadEventPhoto(file: File, ownerId: string): Promise<string> {
  return uploadToBucket("event-photos", file, ownerId);
}

export function uploadAvatar(file: File, ownerId: string): Promise<string> {
  return uploadToBucket("avatars", file, ownerId);
}
