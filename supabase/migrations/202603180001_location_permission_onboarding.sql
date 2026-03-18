-- Persist customer location-permission onboarding state for cross-device onboarding gating.
-- Safe to run multiple times.

alter table if exists public.profiles
  add column if not exists location_permission_status text
    check (location_permission_status in ('granted', 'denied', 'unsupported')),
  add column if not exists location_permission_updated_at timestamptz,
  add column if not exists location_onboarding_last_prompted_at timestamptz;
