alter table public.laundry_shops
add column if not exists starting_price numeric(10,2) not null default 0 check (starting_price >= 0),
add column if not exists load_capacity_kg numeric(8,2) not null default 8 check (load_capacity_kg > 0);

update public.laundry_shops
set starting_price = coalesce(nullif(starting_price, 0), price_per_kg, 0)
where starting_price = 0;

alter table public.services
add column if not exists description text,
add column if not exists pricing_model text not null default 'per_kg' check (pricing_model in ('per_kg', 'per_load')),
add column if not exists unit_price numeric(10,2) not null default 0 check (unit_price >= 0),
add column if not exists load_capacity_kg numeric(8,2) check (load_capacity_kg > 0);

update public.services
set unit_price = coalesce(nullif(unit_price, 0), price_per_kg, 0)
where unit_price = 0;

create table if not exists public.service_option_groups (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null,
  option_type text not null check (option_type in ('detergent', 'fabcon', 'addon')),
  selection_type text not null default 'single' check (selection_type in ('single', 'multiple')),
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_service_option_groups_service_id on public.service_option_groups(service_id);

create table if not exists public.service_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.service_option_groups(id) on delete cascade,
  name text not null,
  description text,
  price_delta numeric(10,2) not null default 0 check (price_delta >= 0),
  price_type text not null default 'per_order' check (price_type in ('per_order', 'per_load')),
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_service_options_group_id on public.service_options(group_id);

alter table public.orders
add column if not exists selected_option_ids uuid[] not null default array[]::uuid[],
add column if not exists service_snapshot jsonb not null default '{}'::jsonb,
add column if not exists pricing_breakdown jsonb not null default '{}'::jsonb;

alter table public.service_option_groups enable row level security;
alter table public.service_options enable row level security;

create policy "service_option_groups_read"
on public.service_option_groups
for select
using (
  exists (
    select 1
    from public.services s
    join public.laundry_shops ls on ls.id = s.shop_id
    where s.id = service_option_groups.service_id
      and (ls.is_verified = true or ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "service_option_groups_owner_write"
on public.service_option_groups
for all
using (
  exists (
    select 1
    from public.services s
    join public.laundry_shops ls on ls.id = s.shop_id
    where s.id = service_option_groups.service_id
      and (ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
)
with check (
  exists (
    select 1
    from public.services s
    join public.laundry_shops ls on ls.id = s.shop_id
    where s.id = service_option_groups.service_id
      and (ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "service_options_read"
on public.service_options
for select
using (
  exists (
    select 1
    from public.service_option_groups sog
    join public.services s on s.id = sog.service_id
    join public.laundry_shops ls on ls.id = s.shop_id
    where sog.id = service_options.group_id
      and (ls.is_verified = true or ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "service_options_owner_write"
on public.service_options
for all
using (
  exists (
    select 1
    from public.service_option_groups sog
    join public.services s on s.id = sog.service_id
    join public.laundry_shops ls on ls.id = s.shop_id
    where sog.id = service_options.group_id
      and (ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
)
with check (
  exists (
    select 1
    from public.service_option_groups sog
    join public.services s on s.id = sog.service_id
    join public.laundry_shops ls on ls.id = s.shop_id
    where sog.id = service_options.group_id
      and (ls.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

update public.laundry_shops
set load_capacity_kg = 8,
    starting_price = 65,
    price_per_kg = 65,
    description = 'Flexible self-service and full-service laundry with 8 kg machine loads and custom care options.'
where id = '6f8cbf7c-38d4-4c45-b0d4-9afe8196c9a1';

update public.laundry_shops
set load_capacity_kg = 7,
    starting_price = 85,
    price_per_kg = 85
where id = '2e437fbe-9604-4f08-bf85-fd950ebf35cb';

update public.laundry_shops
set load_capacity_kg = 7,
    starting_price = 60,
    price_per_kg = 60
where id = '24f8b1ec-5b75-4b6c-af37-2684acfef3eb';

update public.laundry_shops
set load_capacity_kg = 8,
    starting_price = 98,
    price_per_kg = 98
where id = 'f71eb8ef-c283-4dd5-b1e4-f49ed3c862b6';

update public.services
set name = 'Self-Service Wash',
    description = 'Use an 8 kg washer yourself. Good for everyday clothes and linens.',
    pricing_model = 'per_load',
    unit_price = 65,
    price_per_kg = 65,
    load_capacity_kg = 8
where id = 'f2a2d8ee-a54d-40b5-8e29-83fb616eb7b2';

update public.services
set name = 'Wash, Dry & Fold',
    description = 'Staff-handled full service with wash, dry, fold, and your chosen detergent and fabcon.',
    pricing_model = 'per_load',
    unit_price = 165,
    price_per_kg = 165,
    load_capacity_kg = 8
where id = '7a35768e-7f33-4f04-a0c7-68dcf2f8ae5b';

insert into public.services (id, shop_id, name, description, pricing_model, unit_price, price_per_kg, load_capacity_kg)
values (
  '91ea3c57-d3f8-495d-8ff9-541f5d73c44f',
  '6f8cbf7c-38d4-4c45-b0d4-9afe8196c9a1',
  'Self-Service Dry',
  'Use an 8 kg dryer yourself after washing.',
  'per_load',
  50,
  50,
  8
)
on conflict (id) do update
set shop_id = excluded.shop_id,
    name = excluded.name,
    description = excluded.description,
    pricing_model = excluded.pricing_model,
    unit_price = excluded.unit_price,
    price_per_kg = excluded.price_per_kg,
    load_capacity_kg = excluded.load_capacity_kg;

update public.services
set name = 'Premium Care',
    description = 'Per-kilo premium washing with delicate-safe settings.',
    pricing_model = 'per_kg',
    unit_price = 110,
    price_per_kg = 110,
    load_capacity_kg = 7
where id = '8c20ea45-a78d-4f7e-b379-f33588f4f49b';

update public.services
set name = 'Deluxe Dry Clean',
    description = 'Dry-cleaning for formal wear and garments that need special handling.',
    pricing_model = 'per_kg',
    unit_price = 220,
    price_per_kg = 220,
    load_capacity_kg = 7
where id = '7833206d-d8cc-4e42-a23c-997d2b4ff4e7';

insert into public.services (id, shop_id, name, description, pricing_model, unit_price, price_per_kg, load_capacity_kg)
values (
  '4ce98f9c-c9dd-4654-ae43-7cda48215361',
  '2e437fbe-9604-4f08-bf85-fd950ebf35cb',
  'Family Load Bundle',
  'One 7 kg bundle with wash, dry, and fold for regular household laundry.',
  'per_load',
  185,
  185,
  7
)
on conflict (id) do update
set shop_id = excluded.shop_id,
    name = excluded.name,
    description = excluded.description,
    pricing_model = excluded.pricing_model,
    unit_price = excluded.unit_price,
    price_per_kg = excluded.price_per_kg,
    load_capacity_kg = excluded.load_capacity_kg;

update public.services
set name = 'Wash & Iron',
    description = 'Per-load wash service with neatly pressed finishes for uniforms and office wear.',
    pricing_model = 'per_load',
    unit_price = 110,
    price_per_kg = 110,
    load_capacity_kg = 7
where id = '48632fdf-91d3-42d4-b296-541ce8ff5a57';

update public.services
set name = 'Blanket Cleaning',
    description = 'Deep-cleaning for comforters, blankets, and bulky linen.',
    pricing_model = 'per_load',
    unit_price = 145,
    price_per_kg = 145,
    load_capacity_kg = 7
where id = 'f81284fd-ebca-4cb3-9a8d-364f70e86f65';

insert into public.services (id, shop_id, name, description, pricing_model, unit_price, price_per_kg, load_capacity_kg)
values (
  'd0a643a6-1776-43ab-a3c8-942f0a471056',
  '24f8b1ec-5b75-4b6c-af37-2684acfef3eb',
  'Self-Service Wash',
  'Budget-friendly self-service wash for daily loads.',
  'per_load',
  60,
  60,
  7
)
on conflict (id) do update
set shop_id = excluded.shop_id,
    name = excluded.name,
    description = excluded.description,
    pricing_model = excluded.pricing_model,
    unit_price = excluded.unit_price,
    price_per_kg = excluded.price_per_kg,
    load_capacity_kg = excluded.load_capacity_kg;

update public.services
set name = 'Same-Day Bundle',
    description = 'Fast wash, dry, and fold bundle with priority turnaround.',
    pricing_model = 'per_load',
    unit_price = 190,
    price_per_kg = 190,
    load_capacity_kg = 8
where id = '3d35ecaf-27fd-4a57-b11a-d44f3928f66c';

update public.services
set name = 'Eco Wash',
    description = 'Per-kilo wash using low-residue detergent options.',
    pricing_model = 'per_kg',
    unit_price = 98,
    price_per_kg = 98,
    load_capacity_kg = 8
where id = 'c64922b9-c2a4-4b67-a0f8-cd56749f95b4';

insert into public.service_option_groups (id, service_id, name, option_type, selection_type, is_required, sort_order)
values
  ('eab70d0f-f4a0-43d9-bf72-e1bfa90fc6e1', '7a35768e-7f33-4f04-a0c7-68dcf2f8ae5b', 'Detergent', 'detergent', 'single', true, 1),
  ('3d4cdfd8-8dfd-4492-8e88-ee632d1bb52f', '7a35768e-7f33-4f04-a0c7-68dcf2f8ae5b', 'Fabcon', 'fabcon', 'single', true, 2),
  ('ef298b14-f84b-4021-838a-ac4f6198c193', '7a35768e-7f33-4f04-a0c7-68dcf2f8ae5b', 'Add-ons', 'addon', 'multiple', false, 3),
  ('52c742ca-1349-4478-8e4a-7859ec4f4407', '4ce98f9c-c9dd-4654-ae43-7cda48215361', 'Detergent', 'detergent', 'single', true, 1),
  ('cfd6f4fb-e934-47e2-b2a4-b94918cac4e0', '4ce98f9c-c9dd-4654-ae43-7cda48215361', 'Fabcon', 'fabcon', 'single', true, 2),
  ('18dd6308-a608-4b94-930c-6dfd6698236f', '4ce98f9c-c9dd-4654-ae43-7cda48215361', 'Add-ons', 'addon', 'multiple', false, 3),
  ('69141d9f-0823-4c6b-beaa-e7ea52d27468', '48632fdf-91d3-42d4-b296-541ce8ff5a57', 'Finishing', 'addon', 'multiple', false, 1)
on conflict (id) do update
set service_id = excluded.service_id,
    name = excluded.name,
    option_type = excluded.option_type,
    selection_type = excluded.selection_type,
    is_required = excluded.is_required,
    sort_order = excluded.sort_order;

insert into public.service_options (id, group_id, name, description, price_delta, price_type, is_default, sort_order)
values
  ('1d5f40d3-617f-42af-ae43-75920de2fb46', 'eab70d0f-f4a0-43d9-bf72-e1bfa90fc6e1', 'House Blend', 'Balanced detergent for everyday clothes.', 0, 'per_order', true, 1),
  ('7f337e76-1374-400d-b81a-dd2fdf9710b0', 'eab70d0f-f4a0-43d9-bf72-e1bfa90fc6e1', 'Baby Safe', 'Mild detergent for infant wear and sensitive skin.', 20, 'per_load', false, 2),
  ('d573f8e4-87be-4a12-a119-c8935f7ecd6a', 'eab70d0f-f4a0-43d9-bf72-e1bfa90fc6e1', 'Hypoallergenic', 'Low-residue detergent for allergy-sensitive customers.', 25, 'per_load', false, 3),

  ('324a3473-1398-4adc-aebe-c3d9f116fce2', '3d4cdfd8-8dfd-4492-8e88-ee632d1bb52f', 'Fresh Morning', 'Light clean scent.', 0, 'per_order', true, 1),
  ('fd22b754-038f-404b-b9b7-40cb204419da', '3d4cdfd8-8dfd-4492-8e88-ee632d1bb52f', 'Ocean Breeze', 'Longer-lasting fresh scent.', 15, 'per_load', false, 2),
  ('00b3dbdf-6b70-443c-b655-3fa666da9ba7', '3d4cdfd8-8dfd-4492-8e88-ee632d1bb52f', 'Sampaguita Soft', 'Floral finish with softening boost.', 20, 'per_load', false, 3),

  ('d23d237a-f757-4f0a-84e0-ae77566840eb', 'ef298b14-f84b-4021-838a-ac4f6198c193', 'Express turnaround', 'Prioritize washing queue for faster release.', 35, 'per_load', false, 1),
  ('14c84c57-0a13-463c-a9a8-1dcb3d55798c', 'ef298b14-f84b-4021-838a-ac4f6198c193', 'Stain treatment', 'Targeted spotting for collars and common stain areas.', 40, 'per_order', false, 2),
  ('66432ab6-cffc-4bbe-9dd7-6c1fd6a28146', 'ef298b14-f84b-4021-838a-ac4f6198c193', 'Ironing', 'Add pressing for ready-to-store laundry.', 55, 'per_load', false, 3),

  ('8c39fc7a-ca64-4b4d-a95f-418e7e8e7c56', '52c742ca-1349-4478-8e4a-7859ec4f4407', 'Delicate Clean', 'Gentle premium detergent included in the family bundle.', 0, 'per_order', true, 1),
  ('73acb0bc-825f-4706-a0d8-c2d8fe7974f8', '52c742ca-1349-4478-8e4a-7859ec4f4407', 'Ultra White', 'Brightening formula for whites and linens.', 18, 'per_load', false, 2),

  ('96f4c4fe-f0f7-4460-b5ec-818912e3b63a', 'cfd6f4fb-e934-47e2-b2a4-b94918cac4e0', 'Comfort Fresh', 'Softener included in the bundle.', 0, 'per_order', true, 1),
  ('7067ef90-bf32-4a9e-8468-a0bf3105ea7d', 'cfd6f4fb-e934-47e2-b2a4-b94918cac4e0', 'Lavender Calm', 'Relaxing scent for bedding and nightwear.', 12, 'per_load', false, 2),

  ('7ca1dbdf-b3f5-44c9-92d9-cce14b4dc6d0', '18dd6308-a608-4b94-930c-6dfd6698236f', 'Folding boards', 'Sharper fold lines for delivery-ready laundry.', 20, 'per_order', false, 1),
  ('d1f39ab8-48d5-45d5-bc33-b98d6763c993', '18dd6308-a608-4b94-930c-6dfd6698236f', 'Priority release', 'Move this order to the next available release slot.', 30, 'per_load', false, 2),

  ('3aab3fe7-17a8-401a-a0a4-d8afef40fcb4', '69141d9f-0823-4c6b-beaa-e7ea52d27468', 'Heavy starch', 'Crisp press for uniforms and formal wear.', 30, 'per_load', false, 1),
  ('03fbf759-bc9b-405b-b8b7-bfc9e98088e7', '69141d9f-0823-4c6b-beaa-e7ea52d27468', 'Garment bag return', 'Return pressed items in reusable garment bags.', 25, 'per_order', false, 2)
on conflict (id) do update
set group_id = excluded.group_id,
    name = excluded.name,
    description = excluded.description,
    price_delta = excluded.price_delta,
    price_type = excluded.price_type,
    is_default = excluded.is_default,
    sort_order = excluded.sort_order;