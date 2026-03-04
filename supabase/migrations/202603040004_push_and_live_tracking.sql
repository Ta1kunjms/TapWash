create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists rider_locations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  rider_id uuid not null references riders(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  heading double precision,
  speed_kph double precision,
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);
create index if not exists idx_rider_locations_order_id on rider_locations(order_id);
create index if not exists idx_rider_locations_rider_id on rider_locations(rider_id);

alter table push_subscriptions enable row level security;
alter table rider_locations enable row level security;

create policy "push_subscriptions_owner_select"
on push_subscriptions
for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "push_subscriptions_owner_insert"
on push_subscriptions
for insert
with check (user_id = auth.uid());

create policy "push_subscriptions_owner_delete"
on push_subscriptions
for delete
using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "rider_locations_scoped_read"
on rider_locations
for select
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from orders o
    where o.id = rider_locations.order_id
      and (
        o.customer_id = auth.uid()
        or exists (select 1 from laundry_shops ls where ls.id = o.shop_id and ls.owner_id = auth.uid())
      )
  )
);

create policy "rider_locations_shop_or_admin_write"
on rider_locations
for all
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from orders o
    join laundry_shops ls on ls.id = o.shop_id
    where o.id = rider_locations.order_id and ls.owner_id = auth.uid()
  )
)
with check (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from orders o
    join laundry_shops ls on ls.id = o.shop_id
    where o.id = rider_locations.order_id and ls.owner_id = auth.uid()
  )
);
