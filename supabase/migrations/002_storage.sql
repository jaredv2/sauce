-- Sauce v1 - Storage buckets + policies
-- Source: sauce-v1-spec.md §3 (Storage buckets)
-- Run AFTER 001_initial_schema.sql in Supabase SQL editor.
-- Creates 3 public buckets and RLS policies enforcing {profile_id} prefix ownership.

-- ============================================
-- Buckets (public = true = files served publicly)
-- ============================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('backgrounds', 'backgrounds', true),
  ('audio', 'audio', true)
on conflict (id) do nothing;

-- Ensure RLS is enabled (already enabled by Supabase, but safe)
-- alter table storage.objects enable row level security;

-- ============================================
-- Public read - all buckets are publicly readable (anon + authenticated)
-- One policy per bucket so you can tighten later without affecting others
-- ============================================
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "backgrounds public read" on storage.objects;
create policy "backgrounds public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'backgrounds');

drop policy if exists "audio public read" on storage.objects;
create policy "audio public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'audio');

-- ============================================
-- Write (insert/update/delete) - only own {profile_id} prefix
-- Path conventions:
--   avatars/{profile_id}/{filename}
--   backgrounds/{profile_id}/{page_id}/landing.{ext}
--   backgrounds/{profile_id}/{page_id}/main.{ext}
--   audio/{profile_id}/{page_id}/{filename}
-- Check: (storage.foldername(name))[1] = auth.uid()::text
-- Supabase requires parentheses: (storage.foldername(name))[1]
-- ============================================

-- avatars
drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- backgrounds
drop policy if exists "backgrounds insert own" on storage.objects;
create policy "backgrounds insert own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "backgrounds update own" on storage.objects;
create policy "backgrounds update own"
  on storage.objects for update to authenticated
  using (bucket_id = 'backgrounds' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "backgrounds delete own" on storage.objects;
create policy "backgrounds delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

-- audio
drop policy if exists "audio insert own" on storage.objects;
create policy "audio insert own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "audio update own" on storage.objects;
create policy "audio update own"
  on storage.objects for update to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "audio delete own" on storage.objects;
create policy "audio delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
