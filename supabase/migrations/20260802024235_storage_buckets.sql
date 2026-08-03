-- Storage buckets for Phase 2 uploads: event photos (Create flow) and
-- avatars (Settings PhotoSlot). Both public-read, matching the "open now,
-- harden later" posture — anon can upload directly with the publishable
-- key. TODO(Phase 3): scope insert/update/delete to auth.uid()-owned
-- objects once real auth lands.

insert into storage.buckets (id, name, public)
values
  ('event-photos', 'event-photos', true),
  ('avatars', 'avatars', true);

create policy "event photos are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'event-photos');

create policy "anyone can upload an event photo"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'event-photos');

create policy "avatars are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "anyone can upload an avatar"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'avatars');

create policy "anyone can replace an avatar"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');
