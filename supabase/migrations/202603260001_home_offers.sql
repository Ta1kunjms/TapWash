create table if not exists public.home_offers (
  id uuid primary key default gen_random_uuid(),
  badge_label text not null default 'LIMITED PROMO',
  title text not null,
  subtitle text,
  cta_label text not null default 'Claim Offer',
  cta_href text not null default '/customer/vouchers',
  accent_from text not null default '#1e88e5',
  accent_to text not null default '#5bb8ff',
  priority integer not null default 0,
  audience text not null default 'all' check (audience in ('all', 'new', 'returning', 'favorites')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_home_offers_active_window
  on public.home_offers (is_active, starts_at, ends_at, priority desc, created_at desc);

create or replace function public.touch_home_offers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_home_offers_updated_at on public.home_offers;
create trigger trg_home_offers_updated_at
before update on public.home_offers
for each row
execute procedure public.touch_home_offers_updated_at();

alter table if exists public.home_offers enable row level security;

drop policy if exists "home_offers_read_authenticated" on public.home_offers;
create policy "home_offers_read_authenticated"
on public.home_offers
for select
using (auth.role() = 'authenticated' or public.is_admin(auth.uid()));

drop policy if exists "home_offers_admin_insert" on public.home_offers;
create policy "home_offers_admin_insert"
on public.home_offers
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "home_offers_admin_update" on public.home_offers;
create policy "home_offers_admin_update"
on public.home_offers
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "home_offers_admin_delete" on public.home_offers;
create policy "home_offers_admin_delete"
on public.home_offers
for delete
using (public.is_admin(auth.uid()));

insert into public.home_offers (badge_label, title, subtitle, cta_label, cta_href, accent_from, accent_to, priority)
select
  'LIMITED PROMO',
  'Flash Sale up to 50% OFF',
  'Apply vouchers on checkout and enjoy same-day pickup.',
  'View Vouchers',
  '/customer/vouchers',
  '#1e88e5',
  '#5bb8ff',
  10
where not exists (
  select 1
  from public.home_offers
  where title = 'Flash Sale up to 50% OFF'
    and cta_href = '/customer/vouchers'
);
