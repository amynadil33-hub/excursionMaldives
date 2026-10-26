-- Row Level Security policies

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.categories enable row level security;
alter table public.destinations enable row level security;
alter table public.experiences enable row level security;
alter table public.experience_images enable row level security;
alter table public.availability_slots enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.vendor_ledger enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.cms_sections enable row level security;
alter table public.banners enable row level security;
alter table public.blog_posts enable row level security;
alter table public.contact_messages enable row level security;
alter table public.settings enable row level security;

-- profiles
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy profiles_admin_delete on public.profiles for delete using (public.is_admin());

-- vendors
create policy vendors_public_select on public.vendors for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy vendors_apply on public.vendors for insert with check (owner_id = auth.uid() or public.is_admin());
create policy vendors_update on public.vendors for update using (owner_id = auth.uid() or public.is_admin());
create policy vendors_admin_delete on public.vendors for delete using (public.is_admin());

-- taxonomy
create policy categories_read on public.categories for select using (is_active or public.is_admin());
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy destinations_read on public.destinations for select using (is_active or public.is_admin());
create policy destinations_admin on public.destinations for all using (public.is_admin()) with check (public.is_admin());

-- experiences
create policy experiences_read on public.experiences for select using (
  (status = 'published' and exists (select 1 from public.vendors v where v.id = vendor_id and v.status = 'approved'))
  or vendor_id = public.my_vendor_id()
  or public.is_admin()
);
create policy experiences_vendor_insert on public.experiences for insert with check (vendor_id = public.my_approved_vendor_id() or public.is_admin());
create policy experiences_vendor_update on public.experiences for update using (vendor_id = public.my_approved_vendor_id() or public.is_admin());
create policy experiences_vendor_delete on public.experiences for delete using (vendor_id = public.my_approved_vendor_id() or public.is_admin());

-- experience images
create policy images_read on public.experience_images for select using (
  exists (select 1 from public.experiences e where e.id = experience_id)
);
create policy images_write on public.experience_images for all using (
  public.is_admin() or exists (select 1 from public.experiences e where e.id = experience_id and e.vendor_id = public.my_approved_vendor_id())
) with check (
  public.is_admin() or exists (select 1 from public.experiences e where e.id = experience_id and e.vendor_id = public.my_approved_vendor_id())
);

-- availability
create policy slots_read on public.availability_slots for select using (
  exists (select 1 from public.experiences e where e.id = experience_id)
);
create policy slots_write on public.availability_slots for all using (
  public.is_admin() or exists (select 1 from public.experiences e where e.id = experience_id and e.vendor_id = public.my_approved_vendor_id())
) with check (
  public.is_admin() or exists (select 1 from public.experiences e where e.id = experience_id and e.vendor_id = public.my_approved_vendor_id())
);

-- promotions: admin only (validated inside create_order)
create policy promotions_admin on public.promotions for all using (public.is_admin()) with check (public.is_admin());

-- orders: created through create_order RPC only
create policy orders_select on public.orders for select using (
  customer_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.bookings b where b.order_id = id and b.vendor_id = public.my_vendor_id())
);
create policy orders_admin_update on public.orders for update using (public.is_admin());

-- bookings
create policy bookings_select on public.bookings for select using (
  public.is_admin() or vendor_id = public.my_vendor_id()
  or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy bookings_vendor_update on public.bookings for update using (vendor_id = public.my_approved_vendor_id() or public.is_admin());

-- payments
create policy payments_select on public.payments for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);

-- payouts & ledger
create policy payouts_select on public.payouts for select using (vendor_id = public.my_vendor_id() or public.is_admin());
create policy payouts_admin on public.payouts for update using (public.is_admin());
create policy ledger_select on public.vendor_ledger for select using (vendor_id = public.my_vendor_id() or public.is_admin());
create policy ledger_admin_insert on public.vendor_ledger for insert with check (public.is_admin());

-- reviews: customers may review experiences they have a paid booking for
create policy reviews_read on public.reviews for select using (status = 'published' or customer_id = auth.uid() or public.is_admin());
create policy reviews_insert on public.reviews for insert with check (
  customer_id = auth.uid() and exists (
    select 1 from public.bookings b join public.orders o on o.id = b.order_id
    where b.experience_id = reviews.experience_id and o.customer_id = auth.uid() and o.status = 'paid'
  )
);
create policy reviews_admin on public.reviews for update using (public.is_admin());
create policy reviews_admin_delete on public.reviews for delete using (public.is_admin() or customer_id = auth.uid());

-- wishlists
create policy wishlists_own on public.wishlists for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- CMS
create policy cms_read on public.cms_sections for select using (true);
create policy cms_admin on public.cms_sections for all using (public.is_admin()) with check (public.is_admin());
create policy banners_read on public.banners for select using (is_active or public.is_admin());
create policy banners_admin on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy blog_read on public.blog_posts for select using (status = 'published' or public.is_admin());
create policy blog_admin on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

-- contact messages: anyone can submit, admins read
create policy contact_insert on public.contact_messages for insert with check (true);
create policy contact_admin on public.contact_messages for select using (public.is_admin());
create policy contact_admin_update on public.contact_messages for update using (public.is_admin());
create policy contact_admin_delete on public.contact_messages for delete using (public.is_admin());

-- settings
create policy settings_read on public.settings for select using (true);
create policy settings_admin on public.settings for all using (public.is_admin()) with check (public.is_admin());
