-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  property_id uuid NOT NULL,
  room_id uuid,
  move_in_timestamp timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  booking_id text NOT NULL CHECK (booking_id ~ '^BK-[0-9]{4}-[0-9]{4}$'::text),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT bookings_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT bookings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.charges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  amount double precision NOT NULL CHECK (amount >= 0::double precision),
  is_taxed boolean NOT NULL DEFAULT false,
  is_refunded boolean NOT NULL DEFAULT false,
  payment_id uuid,
  expense_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT charges_pkey PRIMARY KEY (id),
  CONSTRAINT charges_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
  CONSTRAINT charges_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id),
  CONSTRAINT charges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.company_tenants (
  tenant_id uuid NOT NULL,
  registration_no text NOT NULL UNIQUE CHECK (char_length(registration_no) >= 5 AND char_length(registration_no) <= 50),
  company_name text NOT NULL CHECK (char_length(company_name) >= 2 AND char_length(company_name) <= 200),
  contact_person_first_name text NOT NULL CHECK (char_length(contact_person_first_name) >= 1 AND char_length(contact_person_first_name) <= 100),
  contact_person_last_name text CHECK (char_length(contact_person_last_name) >= 1 AND char_length(contact_person_last_name) <= 100),
  phone_number text NOT NULL CHECK (char_length(phone_number) >= 8 AND char_length(phone_number) <= 20 AND phone_number ~ '^\+[0-9]+$'::text),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT company_tenants_pkey PRIMARY KEY (tenant_id),
  CONSTRAINT company_tenants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT company_tenants_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  start_date timestamp with time zone NOT NULL,
  number_of_months integer CHECK (number_of_months >= 1),
  is_expiry_reminder boolean NOT NULL DEFAULT false,
  expiry_days_before_reminder integer,
  is_rent_reminder boolean NOT NULL DEFAULT false,
  rent_reminder_days_before integer,
  is_overdue_rent_reminder boolean NOT NULL DEFAULT false,
  overdue_days_after_reminder integer,
  property_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  contract_id text NOT NULL CHECK (contract_id ~ '^CTR-[0-9]{4}-[0-9]{4}$'::text),
  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT contracts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id),
  CONSTRAINT contracts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  due_payment_date timestamp with time zone,
  payment_date timestamp with time zone,
  category USER-DEFINED NOT NULL,
  type text NOT NULL CHECK (char_length(type) >= 2 AND char_length(type) <= 100),
  contract_id uuid,
  property_id uuid,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  status USER-DEFINED NOT NULL,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id),
  CONSTRAINT expenses_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT expenses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.individual_tenants (
  tenant_id uuid NOT NULL,
  identity_type USER-DEFINED NOT NULL,
  identity_number text NOT NULL UNIQUE,
  first_name text NOT NULL CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100),
  last_name text CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100),
  phone_number text NOT NULL CHECK (char_length(phone_number) >= 8 AND char_length(phone_number) <= 20 AND phone_number ~ '^\+[0-9]+$'::text),
  CONSTRAINT individual_tenants_pkey PRIMARY KEY (tenant_id),
  CONSTRAINT individual_tenants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.late_payment_charges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  property_id uuid,
  days_after_due integer NOT NULL CHECK (days_after_due >= 1 AND days_after_due <= 28),
  amount double precision NOT NULL CHECK (amount >= 0::double precision),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  room_id uuid,
  CONSTRAINT late_payment_charges_pkey PRIMARY KEY (id),
  CONSTRAINT late_payment_charges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id),
  CONSTRAINT late_payment_charges_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT late_payment_charges_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.leases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  start_date timestamp with time zone NOT NULL,
  number_of_months integer CHECK (number_of_months >= 1),
  payment_day integer NOT NULL CHECK (payment_day >= 1 AND payment_day <= 28),
  monthly_rent double precision NOT NULL CHECK (monthly_rent >= 0::double precision),
  is_expiry_reminder boolean NOT NULL DEFAULT false,
  expiry_days_before_reminder integer,
  is_rent_reminder boolean NOT NULL DEFAULT false,
  rent_reminder_days_before integer,
  is_overdue_rent_reminder boolean NOT NULL DEFAULT false,
  overdue_days_after_reminder integer,
  property_id uuid NOT NULL,
  room_id uuid,
  tenant_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  leave_day integer,
  status USER-DEFINED NOT NULL,
  lease_id text NOT NULL CHECK (lease_id ~ '^LS-[0-9]{4}-[0-9]{4}$'::text),
  CONSTRAINT leases_pkey PRIMARY KEY (id),
  CONSTRAINT leases_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT leases_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT leases_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT leases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT leases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  type USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.organizations_tenants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT organizations_tenants_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_tenants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT organizations_tenants_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organizations_tenants_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.owners (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_name text NOT NULL CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100),
  last_name text CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100),
  email text CHECK (char_length(email) >= 5 AND char_length(email) <= 255 AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  phone_number text NOT NULL CHECK (char_length(phone_number) >= 8 AND char_length(phone_number) <= 20 AND phone_number ~ '^\+[0-9]+$'::text),
  profile_pic text CHECK (char_length(profile_pic) <= 1000),
  profile_thumb text CHECK (char_length(profile_thumb) <= 1000),
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT owners_pkey PRIMARY KEY (id),
  CONSTRAINT owners_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT owners_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.payment_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  amount double precision NOT NULL CHECK (amount >= 0::double precision),
  payment_method USER-DEFINED NOT NULL,
  paid_at timestamp with time zone NOT NULL,
  registrar_role USER-DEFINED NOT NULL,
  registrar uuid,
  expense_id uuid,
  payment_id uuid,
  receipt_image text CHECK (char_length(receipt_image) <= 1000),
  CONSTRAINT payment_history_pkey PRIMARY KEY (id),
  CONSTRAINT payment_history_registrar_fkey FOREIGN KEY (registrar) REFERENCES public.staff(id),
  CONSTRAINT payment_history_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id),
  CONSTRAINT payment_history_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  due_payment_timestamp timestamp with time zone,
  lease_id uuid,
  booking_id uuid,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  status USER-DEFINED NOT NULL,
  type USER-DEFINED NOT NULL,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id),
  CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT payments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  module text NOT NULL CHECK (char_length(module) >= 1 AND char_length(module) <= 100),
  action text NOT NULL CHECK (char_length(action) >= 1 AND char_length(action) <= 100),
  title text NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  description text NOT NULL CHECK (char_length(description) >= 1 AND char_length(description) <= 500),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  state text NOT NULL CHECK (char_length(state) >= 2 AND char_length(state) <= 100),
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL CHECK (char_length(code) >= 1 AND char_length(code) <= 50),
  street_address text NOT NULL CHECK (char_length(street_address) >= 5 AND char_length(street_address) <= 300),
  postal_code text NOT NULL CHECK (char_length(postal_code) >= 4 AND char_length(postal_code) <= 10),
  type USER-DEFINED NOT NULL,
  project_id uuid,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  status USER-DEFINED NOT NULL DEFAULT 'Vacant'::property_status,
  city text NOT NULL,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT properties_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT properties_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.property_default_initial_charges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  property_id uuid,
  charge_type USER-DEFINED NOT NULL,
  amount double precision NOT NULL CHECK (amount >= 0::double precision),
  is_taxed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  room_id uuid,
  is_refundable boolean NOT NULL DEFAULT false,
  CONSTRAINT property_default_initial_charges_pkey PRIMARY KEY (id),
  CONSTRAINT property_default_initial_charges_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT property_default_initial_charges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id),
  CONSTRAINT property_default_initial_charges_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.property_default_lease_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  property_id uuid UNIQUE,
  default_monthly_rent double precision CHECK (default_monthly_rent >= 0::double precision),
  default_payment_day integer CHECK (default_payment_day >= 1 AND default_payment_day <= 28),
  is_expiry_reminder boolean NOT NULL DEFAULT false,
  expiry_days_before_reminder integer,
  is_rent_reminder boolean NOT NULL DEFAULT false,
  rent_reminder_days_before integer,
  is_overdue_rent_reminder boolean NOT NULL DEFAULT false,
  overdue_days_after_reminder integer,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  room_id uuid UNIQUE,
  CONSTRAINT property_default_lease_config_pkey PRIMARY KEY (id),
  CONSTRAINT property_default_lease_config_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT property_default_lease_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id),
  CONSTRAINT property_default_lease_config_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.recurring_configs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  every integer NOT NULL CHECK (every >= 1),
  time_unit USER-DEFINED NOT NULL,
  event_on text,
  payment_id uuid NOT NULL,
  CONSTRAINT recurring_configs_pkey PRIMARY KEY (id),
  CONSTRAINT recurring_configs_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 100),
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.roles_permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT roles_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT roles_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT roles_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id),
  CONSTRAINT roles_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
  property_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  status USER-DEFINED NOT NULL DEFAULT 'Vacant'::property_status,
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.staff (
  id uuid NOT NULL,
  staff_id text NOT NULL CHECK (char_length(staff_id) = 8 AND staff_id ~ '^STF-[0-9]{4}$'::text),
  first_name text NOT NULL CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100),
  last_name text CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100),
  role_id uuid NOT NULL,
  profile_pic text CHECK (char_length(profile_pic) <= 1000),
  profile_thumb text CHECK (char_length(profile_thumb) <= 1000),
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  phone_number text NOT NULL CHECK (char_length(phone_number) >= 8 AND char_length(phone_number) <= 20 AND phone_number ~ '^\+[0-9]+$'::text),
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT staff_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT staff_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT staff_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.tenants (
  id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  profile_pic text CHECK (char_length(profile_pic) <= 1000),
  profile_thumb text CHECK (char_length(profile_thumb) <= 1000),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT tenants_pkey PRIMARY KEY (id),
  CONSTRAINT tenants_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT tenants_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);
CREATE TABLE public.views (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_name text NOT NULL CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100),
  last_name text CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100),
  phone_number text CHECK (phone_number IS NULL OR char_length(phone_number) >= 8 AND char_length(phone_number) <= 20 AND phone_number ~ '^\+[0-9]+$'::text),
  email text CHECK (email IS NULL OR char_length(email) >= 5 AND char_length(email) <= 255 AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  property_id uuid NOT NULL,
  room_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  view_id text NOT NULL CHECK (view_id ~ '^VW-[0-9]{4}-[0-9]{4}$'::text),
  CONSTRAINT views_pkey PRIMARY KEY (id),
  CONSTRAINT views_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT views_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT views_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff(id)
);