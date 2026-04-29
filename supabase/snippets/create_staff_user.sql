-- ============================================================================
-- Seed: Create a staff user (auth account + staff row)
-- ----------------------------------------------------------------------------
-- This script creates a brand-new staff member end-to-end:
--   1. Ensures an organization exists (or reuses one by title)
--   2. Ensures a role exists within that organization (or reuses one by title)
--   3. Creates a Supabase auth.users entry (with hashed password, confirmed email)
--   4. Creates the matching auth.identities row so email/password login works
--   5. Creates the public.staff row with id = auth user id
--
-- The staff-role association in this app is defined purely by the existence of
-- a public.staff row pointing at the auth user — there is no JWT claim to set.
-- See app/api/user/info/route.ts for how the app determines userType='staff'.
--
-- Edit the values in the DECLARE section below, then run the whole script as
-- a superuser (e.g. via Supabase SQL editor or `psql` with service_role URL).
-- ============================================================================

DO $$
DECLARE
  -- ============ EDIT THESE ============
  v_email             text := 'staffuser' || (SELECT COUNT(*)::text FROM auth.users WHERE email LIKE 'staffuser%') || '@example.com';
  v_password          text := 'ChangeMe123!';          -- minimum 6 chars; tell the user to change after first login
  v_first_name        text := 'Jane';
  v_last_name         text := 'Doe';                    -- optional, can be NULL
  v_phone_number      text := '+60123456789';           -- must match ^\+[0-9]+$ and 8-20 chars
  v_staff_id          text := 'STF-0001';               -- must match ^STF-[0-9]{4}$
  v_profile_pic       text := NULL;                     -- optional
  v_profile_thumb     text := NULL;                     -- optional

  v_organization_title text := 'EzyFusion';             -- will be created if it doesn't exist
  v_organization_type  public.organization_type := 'Property Manager';  -- valid values: 'Owner', 'Property Manager'

  v_role_title         text := 'Admin';                 -- will be created if it doesn't exist for this org
  -- ====================================

  v_user_id        uuid := gen_random_uuid();
  v_org_id         uuid;
  v_role_id        uuid;
  v_identity_id    uuid := gen_random_uuid();
BEGIN
  -- 1. Ensure organization exists (lookup by title, create if missing)
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE title = v_organization_title
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (id, title, type, created_at)
    VALUES (gen_random_uuid(), v_organization_title, v_organization_type, now())
    RETURNING id INTO v_org_id;
    RAISE NOTICE 'Created organization %: %', v_organization_title, v_org_id;
  ELSE
    RAISE NOTICE 'Reusing existing organization %: %', v_organization_title, v_org_id;
  END IF;

  -- 2. Ensure role exists within that organization
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE title = v_role_title AND organization_id = v_org_id
  LIMIT 1;

  IF v_role_id IS NULL THEN
    INSERT INTO public.roles (id, title, organization_id, created_at)
    VALUES (gen_random_uuid(), v_role_title, v_org_id, now())
    RETURNING id INTO v_role_id;
    RAISE NOTICE 'Created role %: %', v_role_title, v_role_id;
  ELSE
    RAISE NOTICE 'Reusing existing role %: %', v_role_title, v_role_id;
  END IF;

  -- 3. Block if an auth user with this email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'An auth.users row with email % already exists. Pick a different email or delete the existing user first.', v_email;
  END IF;

  -- 4. Create the Supabase auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 5. Create the matching identity row (required for email/password login)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_identity_id,
    v_user_id,
    v_user_id::text,
    'email',
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    now(),
    now(),
    now()
  );

  -- 6. Create the public.staff row (id must equal auth user id)
  INSERT INTO public.staff (
    id,
    staff_id,
    first_name,
    last_name,
    role_id,
    profile_pic,
    profile_thumb,
    organization_id,
    phone_number,
    created_at
  ) VALUES (
    v_user_id,
    v_staff_id,
    v_first_name,
    v_last_name,
    v_role_id,
    v_profile_pic,
    v_profile_thumb,
    v_org_id,
    v_phone_number,
    now()
  );

  RAISE NOTICE '-----------------------------------------------------------------';
  RAISE NOTICE 'Staff user created successfully:';
  RAISE NOTICE '  auth user id      : %', v_user_id;
  RAISE NOTICE '  email             : %', v_email;
  RAISE NOTICE '  organization      : % (%)', v_organization_title, v_org_id;
  RAISE NOTICE '  role              : % (%)', v_role_title, v_role_id;
  RAISE NOTICE '  staff_id          : %', v_staff_id;
  RAISE NOTICE 'The user can now log in at the app with the email/password above.';
  RAISE NOTICE '-----------------------------------------------------------------';
END $$;
