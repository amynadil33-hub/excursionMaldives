-- Break the orders <-> bookings policy cycle with security definer helpers
create or replace function public.owns_order(p_order uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.orders o where o.id = p_order and o.customer_id = auth.uid());
$$;

create or replace function public.vendor_in_order(p_order uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bookings b
    where b.order_id = p_order and b.vendor_id = public.my_vendor_id()
  );
$$;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select using (
  customer_id = auth.uid() or public.is_admin() or public.vendor_in_order(id)
);

drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings for select using (
  public.is_admin() or vendor_id = public.my_vendor_id() or public.owns_order(order_id)
);

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select using (
  public.is_admin() or public.owns_order(order_id)
);

-- Vendors may only move a booking through its operational states
create or replace function public.guard_booking_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() and current_user not in ('postgres', 'service_role') then
    if new.status not in ('confirmed', 'completed', 'no_show') and new.status <> old.status then
      raise exception 'Vendors cannot set booking status to %', new.status;
    end if;
    if old.status = 'cancelled' and new.status <> old.status then
      raise exception 'Cancelled bookings cannot be reopened';
    end if;
    new.order_id := old.order_id;
    new.experience_id := old.experience_id;
    new.vendor_id := old.vendor_id;
    new.slot_id := old.slot_id;
    new.booking_date := old.booking_date;
    new.start_time := old.start_time;
    new.adults := old.adults;
    new.children := old.children;
    new.unit_price := old.unit_price;
    new.child_unit_price := old.child_unit_price;
    new.line_total := old.line_total;
    new.commission_rate := old.commission_rate;
    new.commission_amount := old.commission_amount;
    new.vendor_earnings := old.vendor_earnings;
  end if;
  return new;
end;
$$;
drop trigger if exists bookings_guard on public.bookings;
create trigger bookings_guard before update on public.bookings
  for each row execute function public.guard_booking_fields();

-- Booked seat counts are maintained only by create_order / cancel_order
create or replace function public.guard_slot_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() and current_user not in ('postgres', 'service_role') then
    if tg_op = 'INSERT' then
      new.booked := 0;
    else
      new.booked := old.booked;
      new.experience_id := old.experience_id;
      if new.capacity < old.booked then
        raise exception 'Capacity cannot be lower than seats already booked (%)', old.booked;
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists slots_guard on public.availability_slots;
create trigger slots_guard before insert or update on public.availability_slots
  for each row execute function public.guard_slot_fields();

-- Slots with bookings cannot be deleted (FK is restrict; give a clear message)
create or replace function public.guard_slot_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.booked > 0 and not public.is_admin() then
    raise exception 'This slot has bookings and cannot be deleted. Deactivate it instead.';
  end if;
  return old;
end;
$$;
drop trigger if exists slots_guard_delete on public.availability_slots;
create trigger slots_guard_delete before delete on public.availability_slots
  for each row execute function public.guard_slot_delete();

-- Vendors can replace their own branding files
drop policy if exists "vendors_branding_update" on storage.objects;
create policy "vendors_branding_update" on storage.objects for update to authenticated
  using (bucket_id = 'vendors' and ((storage.foldername(name))[1] = public.my_vendor_id()::text or public.is_admin()));
