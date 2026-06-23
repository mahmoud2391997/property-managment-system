-- Complementary migration for seed_permissions.sql
-- Adds missing 'staff.change_role' permission that was introduced during merge resolution

INSERT INTO public.permissions (module, action, title, description)
VALUES ('staff', 'change_role', 'Change Staff Role', 'Change the role of a staff member (requires update permission)')
ON CONFLICT ON CONSTRAINT uq_permissions_module_action
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Attach this permission to the Owner role in every organization
DO $$
DECLARE
  org RECORD;
  owner_role_id UUID;
  change_role_perm_id UUID;
BEGIN
  -- Get the permission ID
  SELECT id INTO change_role_perm_id FROM public.permissions
  WHERE module = 'staff' AND action = 'change_role';

  IF change_role_perm_id IS NULL THEN
    RAISE EXCEPTION 'staff.change_role permission not found';
  END IF;

  FOR org IN SELECT id FROM public.organizations LOOP
    -- Find the Owner role for this organization
    SELECT id INTO owner_role_id FROM public.roles
    WHERE title = 'Owner' AND organization_id = org.id;

    IF owner_role_id IS NOT NULL THEN
      -- Attach the permission if not already attached
      INSERT INTO public.roles_permissions (role_id, permission_id)
      VALUES (owner_role_id, change_role_perm_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
