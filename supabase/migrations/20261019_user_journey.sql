-- GigSaathi AI - User journey: onboarding profile fields, admin read access, profile sync.
-- Run after 20261017_init_gigsaathi.sql and 20261018_auth_profile_trigger.sql.

-- 1. Onboarding fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS work_type TEXT CHECK (work_type IN ('delivery', 'driver', 'daily_wage', 'other')),
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow onboarding to leave language unset until the user picks one
ALTER TABLE public.profiles ALTER COLUMN preferred_language SET DEFAULT 'en';

-- 2. Keep profile in sync with signup metadata (replaces the insert-only trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, preferred_language, primary_platform, city)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone_number',
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'preferred_language', ''), 'en'),
    NEW.raw_user_meta_data ->> 'primary_platform',
    NEW.raw_user_meta_data ->> 'city'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Backfill profiles for users who signed up before the trigger existed
INSERT INTO public.profiles (id, email, full_name, preferred_language)
SELECT u.id, u.email, u.raw_user_meta_data ->> 'full_name', 'en'
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- 3. Admin read access. Role lives in app_metadata, which users cannot modify.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', FALSE);
$$;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all earnings" ON public.earnings_records;
CREATE POLICY "Admins can view all earnings"
  ON public.earnings_records FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaint_drafts;
CREATE POLICY "Admins can view all complaints"
  ON public.complaint_drafts FOR SELECT
  USING (public.is_admin());

-- 4. Users can delete their own profile row (account data deletion)
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- 5. Earnings/complaint user_id must always be the caller (defaults so the client can omit it)
ALTER TABLE public.earnings_records ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.earnings_records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.complaint_drafts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.complaint_drafts ALTER COLUMN user_id SET NOT NULL;
