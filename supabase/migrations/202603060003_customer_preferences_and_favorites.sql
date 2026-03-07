-- Customer preferences and favorites support.
-- Safe to run multiple times.

alter table if exists public.profiles
  add column if not exists preferred_lat double precision,
  add column if not exists preferred_lng double precision,
  add column if not exists notification_last_read_at timestamptz default now();

alter table if exists public.profiles
  alter column notification_last_read_at set default now();

update public.profiles
set notification_last_read_at = now()
where notification_last_read_at is null;

create table if not exists public.customer_favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  shop_id uuid not null references public.laundry_shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, shop_id)
);

create index if not exists idx_customer_favorites_customer_id on public.customer_favorites(customer_id);
create index if not exists idx_customer_favorites_shop_id on public.customer_favorites(shop_id);

alter table if exists public.customer_favorites enable row level security;

drop policy if exists "customer_favorites_owner_select" on public.customer_favorites;
drop policy if exists "customer_favorites_owner_insert" on public.customer_favorites;
drop policy if exists "customer_favorites_owner_delete" on public.customer_favorites;

create policy "customer_favorites_owner_select"
on public.customer_favorites
for select
using (customer_id = auth.uid() or public.is_admin(auth.uid()));

create policy "customer_favorites_owner_insert"
on public.customer_favorites
for insert
with check (customer_id = auth.uid());

create policy "customer_favorites_owner_delete"
on public.customer_favorites
for delete
using (customer_id = auth.uid() or public.is_admin(auth.uid()));
