-- Seed all permissions from the catalog (idempotent)
-- Then create "Owner" role for every organization and attach all permissions.

-- 0. Add unique constraint on module+action if missing (clean up duplicates first)
DO $$
DECLARE
  dup RECORD;
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_permissions_module_action'
  ) THEN
    -- Delete duplicates, keeping the first one
    DELETE FROM public.permissions a USING (
      SELECT id, module, action,
             ROW_NUMBER() OVER (PARTITION BY module, action ORDER BY id) as rn
      FROM public.permissions
    ) b
    WHERE a.id = b.id AND b.rn > 1;

    -- Add the unique constraint
    ALTER TABLE public.permissions
      ADD CONSTRAINT uq_permissions_module_action UNIQUE (module, action);
  END IF;
END $$;

-- 1. Upsert permissions (safe to run multiple times)
INSERT INTO public.permissions (module, action, title, description)
VALUES
  ('dashboard', 'access', 'Access Dashboard', 'View the main dashboard with KPIs and metrics'),
  ('projects', 'access', 'Access Projects', 'View the projects list and any project detail'),
  ('projects', 'create', 'Create Project', 'Create a new project'),
  ('projects', 'update', 'Update Project', 'Edit an existing project'),
  ('projects', 'delete', 'Delete Project', 'Delete a project'),
  ('properties', 'access', 'Access Properties', 'View the Properties module, list, and any property detail'),
  ('properties', 'create', 'Create Property', 'Create a new property'),
  ('properties', 'update', 'Update Property', 'Edit an existing property'),
  ('properties', 'delete', 'Delete Property', 'Delete a property'),
  ('properties', 'assign_owner', 'Assign Owner', 'Assign an owner to a property'),
  ('rooms', 'access', 'Access Rooms', 'View the Rooms module, list, and any room detail'),
  ('rooms', 'create', 'Create Room', 'Create a new room'),
  ('rooms', 'update', 'Update Room', 'Edit an existing room'),
  ('rooms', 'delete', 'Delete Room', 'Delete a room'),
  ('leases', 'access', 'Access Leases', 'View the Leases module, list, and any lease detail'),
  ('leases', 'create', 'Create Lease', 'Create a new lease'),
  ('leases', 'update', 'Update Lease', 'Edit an existing lease'),
  ('leases', 'delete', 'Delete Lease', 'Delete a lease'),
  ('leases', 'end', 'End Lease', 'End or terminate a lease'),
  ('leases', 'transfer', 'Transfer Lease', 'Transfer a lease to another property/room'),
  ('bookings', 'access', 'Access Bookings', 'View the Bookings module, list, and any booking detail'),
  ('bookings', 'create', 'Create Booking', 'Create a new booking'),
  ('bookings', 'update', 'Update Booking', 'Edit an existing booking'),
  ('bookings', 'delete', 'Delete Booking', 'Delete a booking'),
  ('bookings', 'cancel', 'Cancel Booking', 'Cancel a booking'),
  ('contracts', 'access', 'Access Contracts', 'View the Contracts module, list, and any contract detail'),
  ('contracts', 'create', 'Create Contract', 'Create a new contract'),
  ('contracts', 'update', 'Update Contract', 'Edit an existing contract'),
  ('contracts', 'delete', 'Delete Contract', 'Delete a contract'),
  ('payments', 'access', 'Access Payments', 'View the Payments module, list, and any payment detail'),
  ('payments', 'create', 'Create Payment', 'Create a new payment record'),
  ('payments', 'update', 'Update Payment', 'Edit an existing payment'),
  ('payments', 'delete', 'Delete Payment', 'Delete a payment'),
  ('payments', 'refund', 'Refund Payment', 'Process a payment refund'),
  ('expenses', 'access', 'Access Expenses', 'View the Expenses module, list, and any expense detail'),
  ('expenses', 'create', 'Create Expense', 'Create a new expense'),
  ('expenses', 'update', 'Update Expense', 'Edit an existing expense'),
  ('expenses', 'delete', 'Delete Expense', 'Delete an expense'),
  ('expenses', 'approve', 'Approve Expense', 'Approve pending expenses'),
  ('tenants', 'access', 'Access Tenants', 'View the Tenants module, list, and any tenant detail'),
  ('tenants', 'create', 'Create Tenant', 'Create a new tenant'),
  ('tenants', 'update', 'Update Tenant', 'Edit an existing tenant'),
  ('tenants', 'delete', 'Delete Tenant', 'Delete a tenant'),
  ('tenants', 'view_own', 'View Own Tenant Info', 'View and edit own tenant information'),
  ('tenants', 'view_lease', 'View Own Leases', 'View own lease information and payments'),
  ('tenants', 'make_payment', 'Make Payment', 'Make payments for own leases'),
  ('tenants', 'view_property', 'View Properties', 'View properties associated with own leases'),
  ('owners', 'access', 'Access Owners', 'View the Owners module, list, and any owner detail'),
  ('owners', 'create', 'Create Owner', 'Create a new owner'),
  ('owners', 'update', 'Update Owner', 'Edit an existing owner'),
  ('owners', 'delete', 'Delete Owner', 'Delete an owner'),
  ('agents', 'access', 'Access Agents', 'View the Agents module, list, and any agent detail'),
  ('agents', 'create', 'Create Agent', 'Create a new agent'),
  ('agents', 'update', 'Update Agent', 'Edit an existing agent'),
  ('agents', 'delete', 'Delete Agent', 'Delete an agent'),
  ('vendors', 'access', 'Access Vendors', 'View the Vendors module, list, and any vendor detail'),
  ('vendors', 'create', 'Create Vendor', 'Create a new vendor'),
  ('vendors', 'update', 'Update Vendor', 'Edit an existing vendor'),
  ('vendors', 'delete', 'Delete Vendor', 'Delete a vendor'),
  ('staff', 'access', 'Access Staff', 'View the Staff module, list, and any staff detail'),
  ('staff', 'create', 'Create Staff', 'Create a new staff member'),
  ('staff', 'update', 'Update Staff', 'Edit an existing staff member'),
  ('staff', 'delete', 'Delete Staff', 'Delete a staff member'),
  ('staff', 'change_role', 'Change Staff Role', 'Change the role of a staff member (requires update permission)'),
  ('roles', 'access', 'Access Roles', 'View the Roles module and manage role assignments'),
  ('roles', 'create', 'Create Role', 'Create a new role'),
  ('roles', 'update', 'Update Role', 'Edit an existing role'),
  ('roles', 'delete', 'Delete Role', 'Delete a role'),
  ('tasks', 'access', 'Access Tasks', 'View the Tasks module, list, and any task detail'),
  ('tasks', 'create', 'Create Task', 'Create a new task'),
  ('tasks', 'update', 'Update Task', 'Edit an existing task'),
  ('tasks', 'delete', 'Delete Task', 'Delete a task'),
  ('tasks', 'assign', 'Assign Task', 'Assign tasks to staff members'),
  ('tasks', 'complete', 'Complete Task', 'Mark tasks as completed'),
  ('tickets', 'access', 'Access Tickets', 'View the Tickets module, list, and any ticket detail'),
  ('tickets', 'create', 'Create Ticket', 'Create a new ticket'),
  ('tickets', 'update', 'Update Ticket', 'Edit an existing ticket'),
  ('tickets', 'delete', 'Delete Ticket', 'Delete a ticket'),
  ('tickets', 'assign', 'Assign Ticket', 'Assign tickets to staff members'),
  ('tickets', 'resolve', 'Resolve Ticket', 'Resolve tickets'),
  ('notices', 'access', 'Access Notices', 'View the Notices module and manage notices'),
  ('notices', 'create', 'Create Notice', 'Create a new notice'),
  ('notices', 'update', 'Update Notice', 'Edit an existing notice'),
  ('notices', 'delete', 'Delete Notice', 'Delete a notice'),
  ('notices', 'publish', 'Publish Notice', 'Publish notices to tenants'),
  ('notifications', 'access', 'Access Notifications', 'View the Notifications module and manage notifications'),
  ('notifications', 'create', 'Create Notification', 'Create a new notification'),
  ('notifications', 'update', 'Update Notification', 'Edit an existing notification'),
  ('notifications', 'delete', 'Delete Notification', 'Delete a notification'),
  ('notifications', 'send', 'Send Notification', 'Send notifications to users'),
  ('reports', 'access', 'Access Reports', 'View the Reports module and generate reports'),
  ('reports', 'create', 'Create Report', 'Create a new report'),
  ('reports', 'update', 'Update Report', 'Edit an existing report'),
  ('reports', 'delete', 'Delete Report', 'Delete a report'),
  ('reports', 'export', 'Export Report', 'Export reports in various formats'),
  ('views', 'access', 'Access Views', 'View property views and viewing schedules'),
  ('views', 'create', 'Create View', 'Schedule a property viewing'),
  ('views', 'update', 'Update View', 'Edit an existing viewing'),
  ('views', 'delete', 'Delete View', 'Delete a viewing'),
  ('tenant_screening', 'access', 'Access Tenant Screening', 'View the Tenant Screening module and manage screenings'),
  ('tenant_screening', 'create', 'Create Screening', 'Create a new tenant screening'),
  ('tenant_screening', 'update', 'Update Screening', 'Edit an existing screening'),
  ('tenant_screening', 'delete', 'Delete Screening', 'Delete a screening'),
  ('tenant_screening', 'approve', 'Approve Screening', 'Approve tenant screenings'),
  ('recurring', 'access', 'Access Recurring', 'View recurring payments and expenses'),
  ('recurring', 'create', 'Create Recurring', 'Create a new recurring payment/expense'),
  ('recurring', 'update', 'Update Recurring', 'Edit an existing recurring payment/expense'),
  ('recurring', 'delete', 'Delete Recurring', 'Delete a recurring payment/expense'),
  ('financial', 'access', 'Access Financial', 'View financial reports and analytics'),
  ('financial', 'overview', 'Financial Overview', 'View financial overview and metrics'),
  ('financial', 'reports', 'Financial Reports', 'Generate financial reports'),
  ('calendar', 'create', 'Create Calendar Events', 'Create custom calendar events')
ON CONFLICT ON CONSTRAINT uq_permissions_module_action
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- 2. Create "Owner" role for every organization that doesn't have one
DO $$
DECLARE
  org RECORD;
  existing_role UUID;
  new_role UUID;
  first_staff_id UUID;
BEGIN
  FOR org IN SELECT id FROM public.organizations LOOP
    -- Check if Owner role already exists for this org
    SELECT id INTO existing_role FROM public.roles
    WHERE title = 'Owner' AND organization_id = org.id;

    IF existing_role IS NULL THEN
      -- Find first staff member to be created_by
      SELECT id INTO first_staff_id FROM public.staff
      WHERE organization_id = org.id
      LIMIT 1;

      INSERT INTO public.roles (title, organization_id, created_by)
      VALUES ('Owner', org.id, first_staff_id)
      RETURNING id INTO new_role;

      RAISE NOTICE 'Created Owner role for org %', org.id;
    ELSE
      new_role := existing_role;
      RAISE NOTICE 'Owner role already exists for org %', org.id;
    END IF;

    -- 3. Attach all permissions to the Owner role (skip duplicates)
    INSERT INTO public.roles_permissions (role_id, permission_id)
    SELECT new_role, p.id
    FROM public.permissions p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.roles_permissions rp
      WHERE rp.role_id = new_role AND rp.permission_id = p.id
    );

    -- 4. Assign the first staff member to Owner role if they don't have a role
    SELECT id INTO first_staff_id FROM public.staff
    WHERE organization_id = org.id AND role_id IS NULL
    LIMIT 1;

    IF first_staff_id IS NOT NULL THEN
      UPDATE public.staff SET role_id = new_role
      WHERE id = first_staff_id;
      RAISE NOTICE 'Assigned Owner role to staff %', first_staff_id;
    END IF;
  END LOOP;
END $$;
