alter table public.orders
add column if not exists contact_phone text,
add column if not exists delivery_instructions text,
add column if not exists rider_notes text;