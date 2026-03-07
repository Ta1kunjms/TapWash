-- Migration to fix profiles table schema - PostgreSQL version
-- This migration ensures the profiles table matches the actual database structure

-- Check if full_name column exists and create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name text NOT NULL DEFAULT 'User';
    END IF;
END $$;

-- Check if is_suspended column exists and create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_suspended') THEN
        ALTER TABLE profiles ADD COLUMN is_suspended boolean NOT NULL DEFAULT false;
    END IF;
END $$;

-- If we have first_name and surname but no full_name, populate it
UPDATE profiles 
SET full_name = CONCAT(first_name, ' ', surname)
WHERE full_name = 'User' 
  AND (first_name IS NOT NULL OR surname IS NOT NULL);

-- Verify the final schema
-- The profiles table should now have:
-- id (uuid primary key)
-- full_name (text, not null)
-- role (user_role, default 'customer')
-- phone (text)
-- address (text)
-- city_id (uuid)
-- is_suspended (boolean, default false)
-- created_at (timestamptz)