-- Add mascot avatar key for customer profile photos.
-- Nullable for backwards compatibility; application fallback handles null/legacy values.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_key text;
