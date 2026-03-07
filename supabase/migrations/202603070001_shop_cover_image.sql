-- Add optional shop cover image URL for customer-facing menu hero cards.
alter table if exists public.laundry_shops
add column if not exists cover_image_url text;
