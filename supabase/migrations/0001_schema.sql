-- EXCURSION MALDIVES marketplace: core schema
create extension if not exists pgcrypto;

-- Profiles & roles -----------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  country text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'vendor', 'admin')),
  created_at timestamptz not null default now()
);

-- Vendors --------------------------------------------------------------------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique references public.profiles(id) on delete set null,
  business_name text not null,
  slug text not null unique,
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  email text,
  phone text,
  island text,
  registration_number text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended', 'rejected')),
  commission_rate numeric(5,2) not null default 15 check (commission_rate >= 0 and commission_rate <= 100),
  payout_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Taxonomy -------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  atoll text,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- Experiences ----------------------------------------------------------------
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  destination_id uuid references public.destinations(id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  duration_minutes int not null default 120 check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  child_price numeric(10,2) check (child_price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price >= 0),
  currency text not null default 'USD',
  min_guests int not null default 1 check (min_guests >= 1),
  max_guests int not null default 20 check (max_guests >= 1),
  is_private boolean not null default false,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'archived')),
  cover_image text,
  highlights text[] not null default '{}',
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  itinerary jsonb not null default '[]'::jsonb,
  pickup_locations text[] not null default '{}',
  meeting_point text,
  languages text[] not null default '{English}',
  cancellation_policy text default 'Free cancellation up to 24 hours before the start time.',
  rating_avg numeric(3,2) not null default 0,
  review_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists experiences_vendor_idx on public.experiences(vendor_id);
create index if not exists experiences_status_idx on public.experiences(status);
create index if not exists experiences_category_idx on public.experiences(category_id);
create index if not exists experiences_destination_idx on public.experiences(destination_id);

create table if not exists public.experience_images (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  date date not null,
  start_time time not null default '09:00',
  capacity int not null check (capacity >= 0),
  booked int not null default 0 check (booked >= 0),
  price_override numeric(10,2) check (price_override >= 0),
  is_active boolean not null default true,
  unique (experience_id, date, start_time),
  check (booked <= capacity)
);
create index if not exists slots_experience_date_idx on public.availability_slots(experience_id, date);

-- Promotions -----------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  value numeric(10,2) not null check (value > 0),
  min_subtotal numeric(10,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Orders, bookings, payments -------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('EM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'cancelled', 'refunded', 'failed')),
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  currency text not null default 'USD',
  promotion_id uuid references public.promotions(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  notes text,
  payment_provider text default 'bml',
  payment_reference text,
  idempotency_key text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders(customer_id);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete restrict,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  slot_id uuid not null references public.availability_slots(id) on delete restrict,
  booking_date date not null,
  start_time time not null,
  adults int not null check (adults >= 0 and adults <= 50),
  children int not null default 0 check (children >= 0 and children <= 50),
  unit_price numeric(10,2) not null,
  child_unit_price numeric(10,2) not null default 0,
  line_total numeric(10,2) not null,
  commission_rate numeric(5,2) not null,
  commission_amount numeric(10,2) not null,
  vendor_earnings numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  pickup_location text,
  guest_notes text,
  created_at timestamptz not null default now(),
  check (adults + children >= 1)
);
create index if not exists bookings_vendor_idx on public.bookings(vendor_id);
create index if not exists bookings_order_idx on public.bookings(order_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'bml',
  provider_reference text,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'initiated' check (status in ('initiated', 'confirmed', 'failed', 'cancelled', 'refunded')),
  raw jsonb,
  created_at timestamptz not null default now()
);

-- Vendor finance -------------------------------------------------------------
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  status text not null default 'requested' check (status in ('requested', 'processing', 'paid', 'rejected')),
  method text default 'bank_transfer',
  reference text,
  notes text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.vendor_ledger (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  payout_id uuid references public.payouts(id) on delete set null,
  type text not null check (type in ('earning', 'payout', 'refund', 'adjustment')),
  amount numeric(10,2) not null,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists ledger_vendor_idx on public.vendor_ledger(vendor_id);

-- Social ---------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, experience_id)
);

-- CMS ------------------------------------------------------------------------
create table if not exists public.cms_sections (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  cta_label text,
  cta_href text,
  placement text not null default 'home' check (placement in ('home', 'deals', 'explore')),
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image text,
  author text default 'Excursion Maldives',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  kind text not null default 'contact' check (kind in ('contact', 'private_trip')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
