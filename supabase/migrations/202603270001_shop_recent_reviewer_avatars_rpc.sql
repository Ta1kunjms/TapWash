-- Add secure RPC to fetch recent reviewer avatar keys for a shop (public-safe, no PII).
-- This enables the featured laundromat card to showcase real recent customer avatars.

create or replace function public.get_shop_recent_reviewer_avatars(
  p_shop_id uuid,
  p_limit int default 3
)
returns table (
  avatar_key text,
  reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (p.avatar_key)
    p.avatar_key,
    r.created_at as reviewed_at
  from reviews r
  join orders o on r.order_id = o.id
  join profiles p on o.customer_id = p.id
  where o.shop_id = p_shop_id
    and r.created_at is not null
    and p.avatar_key is not null
  order by p.avatar_key, r.created_at desc
  limit p_limit;
$$;

-- Ensure function is executable by anon/authenticated users.
grant execute on function public.get_shop_recent_reviewer_avatars to anon, authenticated;
