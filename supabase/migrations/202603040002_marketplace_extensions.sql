create type payment_method as enum ('cod', 'gcash', 'card');
create type voucher_discount_type as enum ('fixed', 'percent');
create type delivery_status as enum ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled');

alter table orders
  add column if not exists pickup_address text,
  add column if not exists dropoff_address text,
  add column if not exists promo_code text,
  add column if not exists discount_amount numeric(10,2) not null default 0,
  add column if not exists payment_method payment_method not null default 'cod',
  add column if not exists payment_reference text;

alter table laundry_shops
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists total_reviews int not null default 0,
  add column if not exists promo_badge text,
  add column if not exists eta_min int not null default 45,
  add column if not exists eta_max int not null default 90;

create table if not exists riders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  city_id uuid,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  rider_id uuid references riders(id) on delete set null,
  status delivery_status not null default 'assigned',
  assigned_at timestamptz not null default now(),
  picked_at timestamptz,
  delivered_at timestamptz,
  eta_minutes int,
  notes text
);

create table if not exists vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type voucher_discount_type not null,
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  max_discount_amount numeric(10,2),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_riders_profile_id on riders(profile_id);
create index if not exists idx_deliveries_order_id on deliveries(order_id);
create index if not exists idx_deliveries_rider_id on deliveries(rider_id);
create index if not exists idx_vouchers_code on vouchers(code);
create index if not exists idx_order_events_order_id on order_events(order_id);
create index if not exists idx_order_events_created_at on order_events(created_at desc);

alter table riders enable row level security;
alter table deliveries enable row level security;
alter table vouchers enable row level security;
alter table order_events enable row level security;

create policy "riders_admin_or_shop_read"
on riders
for select
using (
  public.is_admin(auth.uid())
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'shop_owner')
);

create policy "riders_admin_manage"
on riders
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "deliveries_read_scoped"
on deliveries
for select
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from orders o
    where o.id = deliveries.order_id
      and (
        o.customer_id = auth.uid()
        or exists (select 1 from laundry_shops ls where ls.id = o.shop_id and ls.owner_id = auth.uid())
      )
  )
);

create policy "deliveries_shop_or_admin_write"
on deliveries
for all
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from orders o
    join laundry_shops ls on ls.id = o.shop_id
    where o.id = deliveries.order_id and ls.owner_id = auth.uid()
  )
)
with check (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from orders o
    join laundry_shops ls on ls.id = o.shop_id
    where o.id = deliveries.order_id and ls.owner_id = auth.uid()
  )
);

create policy "vouchers_public_read_active"
on vouchers
for select
using (is_active = true or public.is_admin(auth.uid()));

create policy "vouchers_admin_manage"
on vouchers
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "events_scoped_read"
on order_events
for select
using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from orders o
    where o.id = order_events.order_id
      and (
        o.customer_id = auth.uid()
        or exists (select 1 from laundry_shops ls where ls.id = o.shop_id and ls.owner_id = auth.uid())
      )
  )
);

create policy "events_scoped_insert"
on order_events
for insert
with check (
  public.is_admin(auth.uid())
  or exists (
    select 1 from orders o
    where o.id = order_events.order_id
      and (
        o.customer_id = auth.uid()
        or exists (select 1 from laundry_shops ls where ls.id = o.shop_id and ls.owner_id = auth.uid())
      )
  )
);

insert into vouchers (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
values
  ('WELCOME100', '₱100 off for first orders', 'fixed', 100, 500, 100, true),
  ('CLEAN15', '15% off laundry subtotal', 'percent', 15, 300, 180, true)
on conflict (code) do nothing;
