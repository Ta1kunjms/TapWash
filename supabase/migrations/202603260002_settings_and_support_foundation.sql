-- Settings and support foundation for customer settings pages.
-- Safe to run multiple times.

alter table if exists public.profiles
  add column if not exists preferred_language text not null default 'en',
  add column if not exists language_updated_at timestamptz;

alter table if exists public.profiles
  drop constraint if exists profiles_preferred_language_check;

alter table if exists public.profiles
  add constraint profiles_preferred_language_check
  check (preferred_language in ('en', 'ar', 'hi', 'ur', 'bn', 'tl', 'fa', 'ne', 'si'));

update public.profiles
set preferred_language = 'en'
where preferred_language is null;

create table if not exists public.customer_payment_preferences (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  method payment_method not null,
  display_label text,
  masked_reference text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_payment_preferences_customer_id
  on public.customer_payment_preferences(customer_id);

create index if not exists idx_customer_payment_preferences_customer_method
  on public.customer_payment_preferences(customer_id, method);

create unique index if not exists uq_customer_payment_preferences_single_default
  on public.customer_payment_preferences(customer_id)
  where is_default = true;

create table if not exists public.help_articles (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  locale text not null default 'en',
  title text not null,
  summary text,
  content text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint help_articles_topic_check check (topic in ('wash-services', 'scheduling', 'payments', 'account')),
  constraint help_articles_locale_check check (locale in ('en', 'ar', 'hi', 'ur', 'bn', 'tl', 'fa', 'ne', 'si'))
);

create index if not exists idx_help_articles_topic_locale
  on public.help_articles(topic, locale, sort_order);

create unique index if not exists uq_help_articles_topic_locale_title
  on public.help_articles(topic, locale, title);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'support_ticket_status') then
    create type support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
  end if;
end $$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  subject text not null,
  message text not null,
  status support_ticket_status not null default 'open',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint support_tickets_topic_check check (topic in ('wash-services', 'scheduling', 'payments', 'account', 'other'))
);

create index if not exists idx_support_tickets_customer_created
  on public.support_tickets(customer_id, created_at desc);

create index if not exists idx_support_tickets_status_updated
  on public.support_tickets(status, updated_at desc);

alter table if exists public.customer_payment_preferences enable row level security;
alter table if exists public.help_articles enable row level security;
alter table if exists public.support_tickets enable row level security;

drop policy if exists "customer_payment_preferences_owner_select" on public.customer_payment_preferences;
drop policy if exists "customer_payment_preferences_owner_insert" on public.customer_payment_preferences;
drop policy if exists "customer_payment_preferences_owner_update" on public.customer_payment_preferences;
drop policy if exists "customer_payment_preferences_owner_delete" on public.customer_payment_preferences;

create policy "customer_payment_preferences_owner_select"
on public.customer_payment_preferences
for select
using (customer_id = auth.uid() or public.is_admin(auth.uid()));

create policy "customer_payment_preferences_owner_insert"
on public.customer_payment_preferences
for insert
with check (customer_id = auth.uid());

create policy "customer_payment_preferences_owner_update"
on public.customer_payment_preferences
for update
using (customer_id = auth.uid() or public.is_admin(auth.uid()))
with check (customer_id = auth.uid() or public.is_admin(auth.uid()));

create policy "customer_payment_preferences_owner_delete"
on public.customer_payment_preferences
for delete
using (customer_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "help_articles_public_select" on public.help_articles;
drop policy if exists "help_articles_admin_all" on public.help_articles;

create policy "help_articles_public_select"
on public.help_articles
for select
using (is_published = true or public.is_admin(auth.uid()));

create policy "help_articles_admin_all"
on public.help_articles
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "support_tickets_owner_select" on public.support_tickets;
drop policy if exists "support_tickets_owner_insert" on public.support_tickets;
drop policy if exists "support_tickets_admin_select" on public.support_tickets;
drop policy if exists "support_tickets_admin_update" on public.support_tickets;

create policy "support_tickets_owner_select"
on public.support_tickets
for select
using (customer_id = auth.uid());

create policy "support_tickets_owner_insert"
on public.support_tickets
for insert
with check (customer_id = auth.uid());

create policy "support_tickets_admin_select"
on public.support_tickets
for select
using (public.is_admin(auth.uid()));

create policy "support_tickets_admin_update"
on public.support_tickets
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

insert into public.help_articles (topic, locale, title, summary, content, sort_order)
values
  (
    'wash-services',
    'en',
    'What services are available?',
    'Understand wash, dry, fold, and add-ons.',
    'TapWash partner shops usually provide wash-and-fold, wash-and-dry, and premium fabric care add-ons. Available options and pricing vary by shop and are shown before checkout.',
    1
  ),
  (
    'scheduling',
    'en',
    'How do pickup and delivery slots work?',
    'Choose pickup and delivery times during checkout.',
    'You can pick your preferred pickup and delivery schedule during checkout. Delivery windows may shift slightly based on rider availability and traffic conditions.',
    1
  ),
  (
    'payments',
    'en',
    'Which payment methods can I use?',
    'Use COD, GCash, or card preference at checkout.',
    'TapWash supports Cash on Delivery, GCash, and card as checkout payment preferences. Your saved preference helps preselect payment in future checkouts.',
    1
  ),
  (
    'account',
    'en',
    'How do I update my profile?',
    'Manage profile, language, and settings from the Settings screen.',
    'Open Settings to update your profile details, choose a preferred language, manage payment preference, and contact support for assistance.',
    1
  )
on conflict do nothing;
