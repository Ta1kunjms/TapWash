alter table public.orders
add column if not exists tip_amount numeric(10,2) not null default 0;