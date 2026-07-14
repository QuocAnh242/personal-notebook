-- Add email to profiles for user search by email or pen name.
-- Run in Supabase SQL Editor if not using Supabase CLI migrations.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username);

-- Backfill emails from auth.users (run as postgres / service role in SQL Editor):
-- UPDATE profiles p
-- SET email = u.email
-- FROM auth.users u
-- WHERE p.id = u.id AND p.email IS NULL;
