create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'other' check (label in ('home', 'work', 'partner', 'other')),
  address_line text not null,
  unit_details text,
  delivery_instructions text,
  lat double precision not null,
  lng double precision not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_addresses_customer_id on public.customer_addresses(customer_id);
create index if not exists idx_customer_addresses_default on public.customer_addresses(customer_id, is_default);

create or replace function public.touch_customer_addresses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customer_addresses_updated_at on public.customer_addresses;
create trigger trg_customer_addresses_updated_at
before update on public.customer_addresses
for each row
execute procedure public.touch_customer_addresses_updated_at();

create or replace function public.ensure_single_default_customer_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.customer_addresses
    set is_default = false
    where customer_id = new.customer_id
      and id <> new.id
      and is_default = true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_customer_addresses_single_default on public.customer_addresses;
create trigger trg_customer_addresses_single_default
before insert or update on public.customer_addresses
for each row
execute procedure public.ensure_single_default_customer_address();

alter table if exists public.customer_addresses enable row level security;

drop policy if exists "customer_addresses_owner_select" on public.customer_addresses;
drop policy if exists "customer_addresses_owner_insert" on public.customer_addresses;
drop policy if exists "customer_addresses_owner_update" on public.customer_addresses;
drop policy if exists "customer_addresses_owner_delete" on public.customer_addresses;

create policy "customer_addresses_owner_select"
on public.customer_addresses
for select
using (customer_id = auth.uid() or public.is_admin(auth.uid()));

create policy "customer_addresses_owner_insert"
on public.customer_addresses
for insert
with check (customer_id = auth.uid());

create policy "customer_addresses_owner_update"
on public.customer_addresses
for update
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

create policy "customer_addresses_owner_delete"
on public.customer_addresses
for delete
using (customer_id = auth.uid() or public.is_admin(auth.uid()));
