-- Alla får läsa
drop policy if exists "properties-anyone-read" on storage.objects;
create policy "properties-anyone-read"
on storage.objects for select to public
using (bucket_id = 'properties');

-- Inloggade får ladda upp under egen mapp
drop policy if exists "properties-user-insert" on storage.objects;
create policy "properties-user-insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'properties'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Uppdatera/radera egna filer
drop policy if exists "properties-user-update" on storage.objects;
create policy "properties-user-update"
on storage.objects for update to authenticated
using (
  bucket_id = 'properties'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'properties'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "properties-user-delete" on storage.objects;
create policy "properties-user-delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'properties'
  and (storage.foldername(name))[1] = auth.uid()::text
);