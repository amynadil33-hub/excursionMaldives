-- Storage buckets for listing photos, vendor branding and CMS media
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('experiences', 'experiences', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('vendors', 'vendors', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('cms', 'cms', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Public read for all three buckets
create policy "media_public_read" on storage.objects for select
  using (bucket_id in ('experiences', 'vendors', 'cms'));

-- Vendors upload into a folder named after their vendor id: experiences/<vendor_id>/...
create policy "experiences_vendor_write" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'experiences'
    and ((storage.foldername(name))[1] = public.my_approved_vendor_id()::text or public.is_admin())
  );
create policy "experiences_vendor_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'experiences'
    and ((storage.foldername(name))[1] = public.my_approved_vendor_id()::text or public.is_admin())
  );

create policy "vendors_branding_write" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vendors'
    and ((storage.foldername(name))[1] = public.my_vendor_id()::text or public.is_admin())
  );

create policy "cms_admin_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'cms' and public.is_admin());
create policy "cms_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cms' and public.is_admin());
