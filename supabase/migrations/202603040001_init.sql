create extension if not exists "pgcrypto";

create type user_role as enum ('customer', 'shop_owner', 'admin');
create type order_status as enum (
  'pending',
  'accepted',
  'picked_up',
  'washing',
  'drying',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled'
);
create type payment_status as enum ('unpaid', 'partially_paid', 'paid', 'refunded');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'customer',
  phone text,
  address text,
  city_id uuid,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists laundry_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  shop_name text not null,
  description text,
  location text not null,
  city_id uuid,
  price_per_kg numeric(10,2) not null check (price_per_kg >= 0),
  commission_percentage numeric(5,2) not null default 10 check (commission_percentage >= 0 and commission_percentage <= 100),
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references laundry_shops(id) on delete cascade,
  name text not null,
  price_per_kg numeric(10,2) not null check (price_per_kg >= 0),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  shop_id uuid not null references laundry_shops(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  weight_estimate numeric(8,2) not null check (weight_estimate > 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  status order_status not null default 'pending',
  pickup_date timestamptz not null,
  delivery_date timestamptz,
  payment_status payment_status not null default 'unpaid',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_laundry_shops_owner_id on laundry_shops(owner_id);
create index if not exists idx_laundry_shops_city_id on laundry_shops(city_id);
create index if not exists idx_services_shop_id on services(shop_id);
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_shop_id on orders(shop_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p where p.id = uid and p.role = 'admin' and p.is_suspended = false
  );
$$;

create or replace function public.valid_order_transition(old_status order_status, new_status order_status)
returns boolean
language sql
immutable
as $$
  select case old_status
    when 'pending' then new_status in ('accepted', 'cancelled')
    when 'accepted' then new_status in ('picked_up', 'cancelled')
    when 'picked_up' then new_status = 'washing'
    when 'washing' then new_status = 'drying'
    when 'drying' then new_status = 'ready'
    when 'ready' then new_status = 'out_for_delivery'
    when 'out_for_delivery' then new_status = 'completed'
    else false
  end;
$$;

create or replace function public.enforce_order_transition()
returns trigger
language plpgsql
as $$
begin
  if old.status <> new.status then
    if not public.valid_order_transition(old.status, new.status) then
      raise exception 'Invalid status transition from % to %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_order_transition on orders;
create trigger trg_enforce_order_transition
before update on orders
for each row
execute procedure public.enforce_order_transition();

alter table profiles enable row level security;
alter table laundry_shops enable row level security;
alter table services enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;

create policy "profiles_self_or_admin_select"
on profiles
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_self_update"
on profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_insert_self"
on profiles
for insert
with check (auth.uid() = id);

create policy "shops_public_read_verified"
on laundry_shops
for select
using (is_verified = true or owner_id = auth.uid() or public.is_admin(auth.uid()));

create policy "shops_owner_insert"
on laundry_shops
for insert
with check (owner_id = auth.uid());

create policy "shops_owner_update"
on laundry_shops
for update
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

create policy "services_read"
on services
for select
using (
  exists (
    select 1 from laundry_shops ls
    where ls.id = services.shop_id
      and (ls.is_verified = true or ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "services_owner_write"
on services
for all
using (
  exists (
    select 1 from laundry_shops ls
    where ls.id = services.shop_id
      and (ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
)
with check (
  exists (
    select 1 from laundry_shops ls
    where ls.id = services.shop_id
      and (ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "orders_select_scoped"
on orders
for select
using (
  customer_id = auth.uid()
  or exists (select 1 from laundry_shops ls where ls.id = orders.shop_id and ls.owner_id = auth.uid())
  or public.is_admin(auth.uid())
);

create policy "orders_customer_insert"
on orders
for insert
with check (customer_id = auth.uid());

create policy "orders_customer_cancel"
on orders
for update
using (customer_id = auth.uid() and status in ('pending', 'accepted'))
with check (customer_id = auth.uid());

create policy "orders_shop_update"
on orders
for update
using (
  exists (select 1 from laundry_shops ls where ls.id = orders.shop_id and ls.owner_id = auth.uid())
)
with check (
  exists (select 1 from laundry_shops ls where ls.id = orders.shop_id and ls.owner_id = auth.uid())
);

create policy "orders_admin_update"
on orders
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "reviews_select_public"
on reviews
for select
using (true);

create policy "reviews_insert_customer_completed"
on reviews
for insert
with check (
  exists (
    select 1
    from orders o
    where o.id = reviews.order_id
      and o.customer_id = auth.uid()
      and o.status = 'completed'
  )
);

create policy "reviews_update_owner"
on reviews
for update
using (
  exists (
    select 1 from orders o where o.id = reviews.order_id and o.customer_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from orders o where o.id = reviews.order_id and o.customer_id = auth.uid()
  )
);
