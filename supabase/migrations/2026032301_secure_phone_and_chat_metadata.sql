-- 1. Support Chat: Persistent Metadata for Optimistic UI
-- Added the 'metadata' column to 'support_messages' to allow storing 'temp_id' 
-- and other client-side telemetry (retries, etc.) without polluting the main schema.
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.support_messages.metadata IS 'Flexible storage for client-side metadata like temp_id, retry_counts, etc.';


-- 2. Security: Secure Phone Update RPC
-- This script brings the server-side identity checks into the repository.
-- This function ensures that:
--   a) A user can only update their own phone number.
--   b) The user must prove control of the email on file (via current auth session check).
--   c) Phone number uniqueness is enforced across all non-archived accounts.
CREATE OR REPLACE FUNCTION public.secure_phone_update(
  p_email TEXT,
  p_new_phone TEXT,
  p_country_code TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to update the 'users' table
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_user_email TEXT;
  v_clean_phone TEXT;
  v_clean_country_code TEXT;
BEGIN
  -- 1. Identity Check: Get the trusted email of the current user from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- 2. Verify: Ensure the requested verification email matches the registered account email.
  IF v_user_email IS NULL OR lower(v_user_email) != lower(p_email) THEN
    RETURN jsonb_build_object(
        'success', false, 
        'message', 'Identity Verification Error: Verification email must match your account email.'
    );
  END IF;

  -- 3. Normalization: Strip all non-digit characters from the phone and country code
  v_clean_phone := regexp_replace(p_new_phone, '\D', '', 'g');
  v_clean_country_code := regexp_replace(p_country_code, '\D', '', 'g');

  -- 4. Availability Check: Check for duplicates using the normalized number
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE phone_number = v_clean_phone 
    AND auth_user_id != auth.uid() 
    AND archived_at IS NULL
  ) THEN
    RETURN jsonb_build_object(
        'success', false, 
        'message', 'This phone number is already linked to another account.'
    );
  END IF;

  -- 5. Secure Update: Target the SINGLE most recent active profile row
  -- Even if dirty data left multiple active rows, this prevents "fanning out" the update.
  UPDATE public.users
  SET 
    phone_number = v_clean_phone,
    country_code = v_clean_country_code,
    last_number_change_at = now(),
    phone_number_set_at = now(),
    updated_at = now()
  WHERE id = (
    SELECT id 
    FROM public.users 
    WHERE auth_user_id = auth.uid() 
      AND archived_at IS NULL 
    ORDER BY created_at DESC 
    LIMIT 1
  );

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Account profile not found.'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Phone number updated successfully.',
    'data', (SELECT to_jsonb(u) FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.archived_at IS NULL ORDER BY created_at DESC LIMIT 1)
  );
END;
$$;


-- 3. Onboarding: Check Phone Availability RPC
-- DEFINITION: Formally adding the missing check_phone_number_availability function to the repository.
-- SECURITY UPGRADE: Added automatic digit-stripping to ensure normalization during lookups.
CREATE OR REPLACE FUNCTION public.check_phone_number_availability(
  p_phone_number TEXT, 
  p_exclude_profile_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_phone TEXT;
BEGIN
  -- Normalize incoming number by stripping all non-digits
  v_clean_phone := regexp_replace(p_phone_number, '\D', '', 'g');

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.phone_number = v_clean_phone
      AND u.archived_at IS NULL
      AND (p_exclude_profile_id IS NULL OR u.id != p_exclude_profile_id)
  );
END;
$$;

COMMENT ON FUNCTION public.check_phone_number_availability(text, uuid) 
IS 'Checks if a normalized phone number is already linked to a non-archived account.';
