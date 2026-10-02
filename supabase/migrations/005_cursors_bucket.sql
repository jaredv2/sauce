insert into storage.buckets (id, name, public)
values ('cursors', 'cursors', true)
on conflict (id) do nothing;

drop policy if exists "cursors public read" on storage.objects;
create policy "cursors public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'cursors');

drop policy if exists "cursors insert own" on storage.objects;
create policy "cursors insert own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cursors' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cursors update own" on storage.objects;
create policy "cursors update own"
  on storage.objects for update to authenticated
  using (bucket_id = 'cursors' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cursors' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cursors delete own" on storage.objects;
create policy "cursors delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cursors' and (storage.foldername(name))[1] = auth.uid()::text);
