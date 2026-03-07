-- Seed verified shops so the customer home page has initial marketplace data.
-- Safe to run multiple times.

do $$
declare
  seed_owner_id uuid;
begin
  select p.id
    into seed_owner_id
  from public.profiles p
  where p.is_suspended = false
  order by p.created_at asc
  limit 1;

  if seed_owner_id is null then
    raise notice 'Skipping shop seed: no profiles found yet.';
    return;
  end if;

  insert into public.laundry_shops (
    id,
    owner_id,
    shop_name,
    description,
    location,
    price_per_kg,
    commission_percentage,
    is_verified,
    rating_avg,
    total_reviews,
    promo_badge,
    eta_min,
    eta_max,
    lat,
    lng
  )
  values
    (
      '6f8cbf7c-38d4-4c45-b0d4-9afe8196c9a1',
      seed_owner_id,
      'FreshFold Express',
      'Fast wash-dry-fold with same-day pickup options.',
      'Makati City',
      85,
      10,
      true,
      4.8,
      216,
      '15% OFF first order',
      35,
      60,
      14.5547,
      121.0244
    ),
    (
      '2e437fbe-9604-4f08-bf85-fd950ebf35cb',
      seed_owner_id,
      'BubbleCare Laundry Hub',
      'Premium garment care and hypoallergenic detergents.',
      'Quezon City',
      90,
      10,
      true,
      4.7,
      174,
      'Free pickup over PHP 799',
      40,
      70,
      14.6471,
      121.0497
    ),
    (
      '24f8b1ec-5b75-4b6c-af37-2684acfef3eb',
      seed_owner_id,
      'SpinCycle Pro',
      'Commercial-grade cleaning for daily and bulk loads.',
      'Pasig City',
      78,
      10,
      true,
      4.6,
      129,
      'Bundle deal available',
      45,
      75,
      14.5764,
      121.0851
    ),
    (
      'f71eb8ef-c283-4dd5-b1e4-f49ed3c862b6',
      seed_owner_id,
      'CloudClean Laundry',
      'Reliable everyday laundry with tracked delivery.',
      'Taguig City',
      95,
      10,
      true,
      4.9,
      261,
      'Same-day slots open',
      30,
      55,
      14.5176,
      121.0509
    )
  on conflict (id) do update
  set
    owner_id = excluded.owner_id,
    shop_name = excluded.shop_name,
    description = excluded.description,
    location = excluded.location,
    price_per_kg = excluded.price_per_kg,
    commission_percentage = excluded.commission_percentage,
    is_verified = excluded.is_verified,
    rating_avg = excluded.rating_avg,
    total_reviews = excluded.total_reviews,
    promo_badge = excluded.promo_badge,
    eta_min = excluded.eta_min,
    eta_max = excluded.eta_max,
    lat = excluded.lat,
    lng = excluded.lng;

  insert into public.services (id, shop_id, name, price_per_kg)
  values
    ('f2a2d8ee-a54d-40b5-8e29-83fb616eb7b2', '6f8cbf7c-38d4-4c45-b0d4-9afe8196c9a1', 'Wash & Fold', 85),
    ('7a35768e-7f33-4f04-a0c7-68dcf2f8ae5b', '6f8cbf7c-38d4-4c45-b0d4-9afe8196c9a1', 'Express Wash', 110),

    ('8c20ea45-a78d-4f7e-b379-f33588f4f49b', '2e437fbe-9604-4f08-bf85-fd950ebf35cb', 'Premium Wash', 90),
    ('7833206d-d8cc-4e42-a23c-997d2b4ff4e7', '2e437fbe-9604-4f08-bf85-fd950ebf35cb', 'Dry Clean', 160),

    ('48632fdf-91d3-42d4-b296-541ce8ff5a57', '24f8b1ec-5b75-4b6c-af37-2684acfef3eb', 'Wash & Iron', 98),
    ('f81284fd-ebca-4cb3-9a8d-364f70e86f65', '24f8b1ec-5b75-4b6c-af37-2684acfef3eb', 'Blanket Cleaning', 140),

    ('3d35ecaf-27fd-4a57-b11a-d44f3928f66c', 'f71eb8ef-c283-4dd5-b1e4-f49ed3c862b6', 'Same-Day Laundry', 120),
    ('c64922b9-c2a4-4b67-a0f8-cd56749f95b4', 'f71eb8ef-c283-4dd5-b1e4-f49ed3c862b6', 'Eco Wash', 102)
  on conflict (id) do update
  set
    shop_id = excluded.shop_id,
    name = excluded.name,
    price_per_kg = excluded.price_per_kg;
end;
$$;