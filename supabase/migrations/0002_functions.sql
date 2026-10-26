-- Helpers, triggers and transactional RPCs

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.my_vendor_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select v.id from public.vendors v where v.owner_id = auth.uid() limit 1;
$$;

create or replace function public.my_approved_vendor_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select v.id from public.vendors v where v.owner_id = auth.uid() and v.status = 'approved' limit 1;
$$;

-- Auto-create profile -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admins from escalating their own role -------------------------
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and current_user not in ('postgres', 'service_role') then
    raise exception 'Only administrators can change roles';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Vendors cannot self-approve or change commission ---------------------------
create or replace function public.guard_vendor_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() and current_user not in ('postgres', 'service_role') then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.commission_rate := coalesce((select (s.value ->> 'default_commission')::numeric from public.settings s where s.key = 'marketplace'), 15);
    else
      new.status := old.status;
      new.commission_rate := old.commission_rate;
      new.owner_id := old.owner_id;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists vendors_guard on public.vendors;
create trigger vendors_guard before insert or update on public.vendors
  for each row execute function public.guard_vendor_fields();

-- When a vendor is approved, grant the owner the vendor role ----------------
create or replace function public.sync_vendor_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is not null then
    if new.status = 'approved' then
      update public.profiles set role = 'vendor' where id = new.owner_id and role = 'customer';
    elsif new.status in ('suspended', 'rejected') then
      update public.profiles set role = 'customer' where id = new.owner_id and role = 'vendor';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists vendors_sync_role on public.vendors;
create trigger vendors_sync_role after insert or update of status on public.vendors
  for each row execute function public.sync_vendor_role();

-- Vendors' listings must be moderated: non-admins cannot publish/feature directly
create or replace function public.guard_experience_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if not public.is_admin() and current_user not in ('postgres', 'service_role') then
    if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
      new.status := 'pending';
    end if;
    if tg_op = 'INSERT' then
      new.is_featured := false;
      new.rating_avg := 0;
      new.review_count := 0;
    else
      new.is_featured := old.is_featured;
      new.rating_avg := old.rating_avg;
      new.review_count := old.review_count;
      new.vendor_id := old.vendor_id;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists experiences_guard on public.experiences;
create trigger experiences_guard before insert or update on public.experiences
  for each row execute function public.guard_experience_fields();

-- Keep review aggregates up to date -----------------------------------------
create or replace function public.refresh_experience_rating()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target uuid := coalesce(new.experience_id, old.experience_id);
begin
  update public.experiences e set
    rating_avg = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.experience_id = target and r.status = 'published'), 0),
    review_count = (select count(*) from public.reviews r where r.experience_id = target and r.status = 'published')
  where e.id = target;
  return null;
end;
$$;
drop trigger if exists reviews_refresh_rating on public.reviews;
create trigger reviews_refresh_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_experience_rating();

-- Vendor balance --------------------------------------------------------------
create or replace function public.vendor_balance(p_vendor uuid)
returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(sum(l.amount), 0) from public.vendor_ledger l
  where l.vendor_id = p_vendor
    and (public.is_admin() or p_vendor = public.my_vendor_id());
$$;

-- Create order: validates availability & prices server-side ------------------
-- p_items: [{ "slot_id": uuid, "adults": int, "children": int, "pickup_location": text }]
create or replace function public.create_order(
  p_items jsonb,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text default null,
  p_notes text default null,
  p_promo_code text default null,
  p_idempotency_key text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_existing uuid;
  v_item record;
  v_slot public.availability_slots%rowtype;
  v_exp public.experiences%rowtype;
  v_vendor public.vendors%rowtype;
  v_promo public.promotions%rowtype;
  v_unit numeric;
  v_child_unit numeric;
  v_line numeric;
  v_commission numeric;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_guests int;
begin
  if v_user is null then raise exception 'You must be signed in to book'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'Too many items in one order'; end if;
  if coalesce(trim(p_contact_name), '') = '' or coalesce(trim(p_contact_email), '') = '' then
    raise exception 'Contact name and email are required';
  end if;

  if p_idempotency_key is not null then
    select o.id into v_existing from public.orders o where o.idempotency_key = p_idempotency_key and o.customer_id = v_user;
    if v_existing is not null then return v_existing; end if;
  end if;

  insert into public.orders (customer_id, contact_name, contact_email, contact_phone, notes, idempotency_key)
  values (v_user, trim(p_contact_name), lower(trim(p_contact_email)), p_contact_phone, p_notes, p_idempotency_key)
  returning id into v_order_id;

  -- Normalize duplicate slots by aggregating guests per slot
  for v_item in
    select (i ->> 'slot_id')::uuid as slot_id,
           sum(coalesce((i ->> 'adults')::int, 0)) as adults,
           sum(coalesce((i ->> 'children')::int, 0)) as children,
           max(i ->> 'pickup_location') as pickup_location
    from jsonb_array_elements(p_items) i
    group by (i ->> 'slot_id')::uuid
  loop
    if v_item.adults < 0 or v_item.children < 0 or v_item.adults > 50 or v_item.children > 50 then
      raise exception 'Invalid guest quantity';
    end if;
    v_guests := v_item.adults + v_item.children;
    if v_guests < 1 then raise exception 'Each booking needs at least one guest'; end if;

    select * into v_slot from public.availability_slots s where s.id = v_item.slot_id for update;
    if not found or not v_slot.is_active then raise exception 'Selected time slot is no longer available'; end if;
    if v_slot.date < current_date then raise exception 'Selected date is in the past'; end if;

    select * into v_exp from public.experiences e where e.id = v_slot.experience_id;
    if v_exp.status <> 'published' then raise exception 'Experience % is not bookable', v_exp.title; end if;
    select * into v_vendor from public.vendors v where v.id = v_exp.vendor_id;
    if v_vendor.status <> 'approved' then raise exception 'Vendor for % is not active', v_exp.title; end if;

    if v_guests < v_exp.min_guests then raise exception '% requires at least % guests', v_exp.title, v_exp.min_guests; end if;
    if v_guests > v_exp.max_guests then raise exception '% allows at most % guests', v_exp.title, v_exp.max_guests; end if;
    if v_slot.booked + v_guests > v_slot.capacity then
      raise exception 'Only % spots left for % on %', v_slot.capacity - v_slot.booked, v_exp.title, v_slot.date;
    end if;

    v_unit := coalesce(v_slot.price_override, v_exp.price);
    v_child_unit := coalesce(v_exp.child_price, v_unit);
    if v_exp.is_private then
      v_line := v_unit;
    else
      v_line := v_unit * v_item.adults + v_child_unit * v_item.children;
    end if;
    v_commission := round(v_line * v_vendor.commission_rate / 100, 2);

    insert into public.bookings (
      order_id, experience_id, vendor_id, slot_id, booking_date, start_time, adults, children,
      unit_price, child_unit_price, line_total, commission_rate, commission_amount, vendor_earnings, pickup_location
    ) values (
      v_order_id, v_exp.id, v_vendor.id, v_slot.id, v_slot.date, v_slot.start_time, v_item.adults, v_item.children,
      v_unit, v_child_unit, v_line, v_vendor.commission_rate, v_commission, v_line - v_commission, v_item.pickup_location
    );

    update public.availability_slots set booked = booked + v_guests where id = v_slot.id;
    v_subtotal := v_subtotal + v_line;
  end loop;

  if p_promo_code is not null and trim(p_promo_code) <> '' then
    select * into v_promo from public.promotions p
    where upper(p.code) = upper(trim(p_promo_code)) and p.is_active
      and (p.starts_at is null or p.starts_at <= now())
      and (p.ends_at is null or p.ends_at >= now())
      and (p.max_uses is null or p.used_count < p.max_uses)
    for update;
    if found and v_subtotal >= v_promo.min_subtotal then
      if v_promo.discount_type = 'percent' then
        v_discount := round(v_subtotal * least(v_promo.value, 100) / 100, 2);
      else
        v_discount := least(v_promo.value, v_subtotal);
      end if;
      update public.promotions set used_count = used_count + 1 where id = v_promo.id;
    end if;
  end if;

  update public.orders set subtotal = v_subtotal, discount = v_discount, total = v_subtotal - v_discount,
    promotion_id = case when v_discount > 0 then v_promo.id else null end
  where id = v_order_id;

  return v_order_id;
end;
$$;

-- Mark paid: only callable by the service role (payment webhook) ------------
create or replace function public.mark_order_paid(p_order_id uuid, p_reference text, p_amount numeric, p_raw jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_booking record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status = 'paid' then return; end if;
  if v_order.status <> 'pending_payment' then raise exception 'Order is not awaiting payment'; end if;
  if round(p_amount, 2) <> round(v_order.total, 2) then raise exception 'Payment amount mismatch'; end if;

  update public.orders set status = 'paid', paid_at = now(), payment_reference = p_reference where id = p_order_id;
  insert into public.payments (order_id, provider, provider_reference, amount, currency, status, raw)
  values (p_order_id, 'bml', p_reference, p_amount, v_order.currency, 'confirmed', p_raw);

  for v_booking in select * from public.bookings where order_id = p_order_id loop
    update public.bookings set status = 'confirmed' where id = v_booking.id;
    insert into public.vendor_ledger (vendor_id, booking_id, type, amount, description)
    values (v_booking.vendor_id, v_booking.id, 'earning', v_booking.vendor_earnings, 'Booking earnings');
  end loop;
end;
$$;

-- Cancel an unpaid order and release capacity --------------------------------
create or replace function public.cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.customer_id <> auth.uid() and not public.is_admin() then raise exception 'Not allowed'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'Only unpaid orders can be cancelled here'; end if;

  update public.availability_slots s set booked = greatest(s.booked - (b.adults + b.children), 0)
  from public.bookings b where b.order_id = p_order_id and b.slot_id = s.id;
  update public.bookings set status = 'cancelled' where order_id = p_order_id;
  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

-- Vendor payout request: cannot exceed available balance ---------------------
create or replace function public.request_payout(p_amount numeric, p_notes text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_vendor uuid := public.my_approved_vendor_id();
  v_available numeric;
  v_id uuid;
begin
  if v_vendor is null then raise exception 'Approved vendor account required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid amount'; end if;
  perform 1 from public.vendors where id = v_vendor for update;
  select coalesce(sum(amount), 0) into v_available from public.vendor_ledger where vendor_id = v_vendor;
  select v_available - coalesce(sum(amount), 0) into v_available from public.payouts
    where vendor_id = v_vendor and status in ('requested', 'processing');
  if p_amount > v_available then raise exception 'Amount exceeds available balance'; end if;
  insert into public.payouts (vendor_id, amount, notes) values (v_vendor, round(p_amount, 2), p_notes) returning id into v_id;
  return v_id;
end;
$$;

-- Admin: settle payout and write ledger entry ---------------------------------
create or replace function public.mark_payout_paid(p_payout_id uuid, p_reference text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_payout public.payouts%rowtype;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into v_payout from public.payouts where id = p_payout_id for update;
  if v_payout.status = 'paid' then return; end if;
  update public.payouts set status = 'paid', reference = p_reference, processed_at = now() where id = p_payout_id;
  insert into public.vendor_ledger (vendor_id, payout_id, type, amount, description)
  values (v_payout.vendor_id, v_payout.id, 'payout', -v_payout.amount, coalesce('Payout ' || p_reference, 'Payout'));
end;
$$;

revoke all on function public.mark_order_paid(uuid, text, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text, numeric, jsonb) to service_role;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.request_payout(numeric, text) to authenticated;
grant execute on function public.mark_payout_paid(uuid, text) to authenticated;
