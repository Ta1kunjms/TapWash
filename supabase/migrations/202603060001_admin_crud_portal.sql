-- Admin CRUD policies for marketplace governance tables.
-- Safe to run multiple times.

alter table if exists public.profiles enable row level security;
alter table if exists public.laundry_shops enable row level security;
alter table if exists public.services enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.reviews enable row level security;
alter table if exists public.riders enable row level security;
alter table if exists public.deliveries enable row level security;
alter table if exists public.vouchers enable row level security;
alter table if exists public.order_events enable row level security;
alter table if exists public.push_subscriptions enable row level security;
alter table if exists public.rider_locations enable row level security;

drop policy if exists "admin_crud_profiles" on public.profiles;
drop policy if exists "admin_crud_laundry_shops" on public.laundry_shops;
drop policy if exists "admin_crud_services" on public.services;
drop policy if exists "admin_crud_orders" on public.orders;
drop policy if exists "admin_crud_reviews" on public.reviews;
drop policy if exists "admin_crud_riders" on public.riders;
drop policy if exists "admin_crud_deliveries" on public.deliveries;
drop policy if exists "admin_crud_vouchers" on public.vouchers;
drop policy if exists "admin_crud_order_events" on public.order_events;
drop policy if exists "admin_crud_push_subscriptions" on public.push_subscriptions;
drop policy if exists "admin_crud_rider_locations" on public.rider_locations;

create policy "admin_crud_profiles"
on public.profiles
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_laundry_shops"
on public.laundry_shops
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_services"
on public.services
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_orders"
on public.orders
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_reviews"
on public.reviews
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_riders"
on public.riders
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_deliveries"
on public.deliveries
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_vouchers"
on public.vouchers
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_order_events"
on public.order_events
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_push_subscriptions"
on public.push_subscriptions
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_crud_rider_locations"
on public.rider_locations
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
