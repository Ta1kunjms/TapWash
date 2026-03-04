alter table orders
  add column if not exists pickup_lat double precision,
  add column if not exists pickup_lng double precision,
  add column if not exists dropoff_lat double precision,
  add column if not exists dropoff_lng double precision,
  add column if not exists distance_km numeric(8,2),
  add column if not exists eta_minutes int;

alter table laundry_shops
  add column if not exists lat double precision,
  add column if not exists lng double precision;

create index if not exists idx_orders_distance_km on orders(distance_km);
create index if not exists idx_orders_eta_minutes on orders(eta_minutes);
