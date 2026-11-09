-- Extra onboarding information for excursion operators and their vessels.
-- JSONB keeps the application flexible for operators with different boat types.
alter table public.vendors
  add column if not exists details jsonb not null default '{}'::jsonb;

