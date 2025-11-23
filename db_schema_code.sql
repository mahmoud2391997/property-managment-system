-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE organization_type AS ENUM ('Owner', 'Property Manager');
CREATE TYPE property_type AS ENUM ('Apartment', 'House', 'Commercial Unit', 'Studio');
CREATE TYPE tenant_type AS ENUM ('Individual', 'Company');
CREATE TYPE payment_status AS ENUM ('Paid', 'Not Paid', 'Paid Late', 'Overdue');
CREATE TYPE payment_method AS ENUM ('Cash', 'Bank Transfer');
CREATE TYPE registrar_role AS ENUM ('tenant', 'staff');
CREATE TYPE expense_category AS ENUM ('Property_Related', 'Contract_Related', 'Staff_Related', 'Company_Related');
CREATE TYPE identity_type AS ENUM ('mykad', 'passport');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
    type organization_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 100),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(title, organization_id)
);

-- Staff table
CREATE TABLE staff (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    staff_id TEXT NOT NULL CHECK (char_length(staff_id) = 8 AND staff_id ~ '^STF-[0-9]{4}$'),
    first_name TEXT NOT NULL CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100),
    last_name TEXT CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100),
    role_id UUID NOT NULL REFERENCES roles(id),
    profile_pic TEXT CHECK (char_length(profile_pic) <= 1000),
    profile_thumb TEXT CHECK (char_length(profile_thumb) <= 1000),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    UNIQUE(staff_id, organization_id)
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module TEXT NOT NULL CHECK (char_length(module) >= 1 AND char_length(module) <= 100),
    action TEXT NOT NULL CHECK (char_length(action) >= 1 AND char_length(action) <= 100),
    title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
    description TEXT NOT NULL CHECK (char_length(description) >= 1 AND char_length(description) <= 500)
);

-- Roles_Permissions table
CREATE TABLE roles_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    UNIQUE(role_id, permission_id)
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
    state TEXT NOT NULL CHECK (char_length(state) >= 2 AND char_length(state) <= 100),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL CHECK (char_length(code) >= 2 AND char_length(code) <= 20),
    street_address TEXT NOT NULL CHECK (char_length(street_address) >= 5 AND char_length(street_address) <= 300),
    postal_code TEXT NOT NULL CHECK (char_length(postal_code) >= 4 AND char_length(postal_code) <= 10),
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    type property_type NOT NULL,
    project_id UUID REFERENCES projects(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    type tenant_type NOT NULL,
    profile_pic TEXT CHECK (char_length(profile_pic) <= 1000),
    profile_thumb TEXT CHECK (char_length(profile_thumb) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Individual_Tenants table
CREATE TABLE individual_tenants (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    identity_type identity_type NOT NULL,
    identity_number TEXT NOT NULL UNIQUE CHECK (
        (identity_type = 'mykad' AND char_length(identity_number) = 12 AND identity_number ~ '^[0-9]{12}$') OR
        (identity_type = 'passport' AND char_length(identity_number) >= 6 AND char_length(identity_number) <= 20)
    ),
    first_name TEXT NOT NULL CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100),
    last_name TEXT CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100),
    phone_number TEXT NOT NULL CHECK (
        char_length(phone_number) >= 8 AND 
        char_length(phone_number) <= 20 AND 
        phone_number ~ '^\+[0-9]+$'
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Company_Tenants table
CREATE TABLE company_tenants (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    registration_no TEXT NOT NULL UNIQUE CHECK (char_length(registration_no) >= 5 AND char_length(registration_no) <= 50),
    company_name TEXT NOT NULL CHECK (char_length(company_name) >= 2 AND char_length(company_name) <= 200),
    contact_person_first_name TEXT NOT NULL CHECK (char_length(contact_person_first_name) >= 1 AND char_length(contact_person_first_name) <= 100),
    contact_person_last_name TEXT CHECK (char_length(contact_person_last_name) >= 1 AND char_length(contact_person_last_name) <= 100),
    phone_number TEXT NOT NULL CHECK (
        char_length(phone_number) >= 8 AND 
        char_length(phone_number) <= 20 AND 
        phone_number ~ '^\+[0-9]+$'
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Owner table
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100),
    last_name TEXT CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100),
    email TEXT CHECK (char_length(email) >= 5 AND char_length(email) <= 255 AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone_number TEXT NOT NULL CHECK (
        char_length(phone_number) >= 8 AND 
        char_length(phone_number) <= 20 AND 
        phone_number ~ '^\+[0-9]+$'
    ),
    profile_pic TEXT CHECK (char_length(profile_pic) <= 1000),
    profile_thumb TEXT CHECK (char_length(profile_thumb) <= 1000),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Leases table
CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date TIMESTAMPTZ NOT NULL,
    number_of_months INTEGER CHECK (number_of_months >= 1),
    payment_day INTEGER NOT NULL CHECK (payment_day >= 1 AND payment_day <= 28),
    monthly_rent DOUBLE PRECISION NOT NULL CHECK (monthly_rent >= 0),
    is_expiry_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_days_before_reminder INTEGER CHECK (
        (is_expiry_reminder = TRUE AND expiry_days_before_reminder IS NOT NULL AND expiry_days_before_reminder >= 0) OR
        (is_expiry_reminder = FALSE)
    ),
    is_rent_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    rent_reminder_days_before INTEGER CHECK (
        (is_rent_reminder = TRUE AND rent_reminder_days_before IS NOT NULL AND rent_reminder_days_before >= 0) OR
        (is_rent_reminder = FALSE)
    ),
    is_overdue_rent_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    overdue_days_after_reminder INTEGER CHECK (
        (is_overdue_rent_reminder = TRUE AND overdue_days_after_reminder IS NOT NULL AND overdue_days_after_reminder >= 0) OR
        (is_overdue_rent_reminder = FALSE)
    ),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date TIMESTAMPTZ NOT NULL,
    number_of_months INTEGER CHECK (number_of_months >= 1),
    is_expiry_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_days_before_reminder INTEGER CHECK (
        (is_expiry_reminder = TRUE AND expiry_days_before_reminder IS NOT NULL AND expiry_days_before_reminder >= 0) OR
        (is_expiry_reminder = FALSE)
    ),
    is_rent_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    rent_reminder_days_before INTEGER CHECK (
        (is_rent_reminder = TRUE AND rent_reminder_days_before IS NOT NULL AND rent_reminder_days_before >= 0) OR
        (is_rent_reminder = FALSE)
    ),
    is_overdue_rent_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    overdue_days_after_reminder INTEGER CHECK (
        (is_overdue_rent_reminder = TRUE AND overdue_days_after_reminder IS NOT NULL AND overdue_days_after_reminder >= 0) OR
        (is_overdue_rent_reminder = FALSE)
    ),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES owners(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    room_id UUID REFERENCES rooms(id),
    move_in_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status payment_status NOT NULL,
    due_payment_timestamp TIMESTAMPTZ,
    type TEXT NOT NULL CHECK (char_length(type) >= 2 AND char_length(type) <= 100),
    receipt_image TEXT CHECK (char_length(receipt_image) <= 1000),
    lease_id UUID REFERENCES leases(id),
    booking_id UUID REFERENCES bookings(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    CHECK (
        (lease_id IS NOT NULL AND booking_id IS NULL) OR
        (lease_id IS NULL AND booking_id IS NOT NULL)
    )
);

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status payment_status NOT NULL,
    due_payment_date TIMESTAMPTZ,
    payment_date TIMESTAMPTZ,
    category expense_category NOT NULL,
    type TEXT NOT NULL CHECK (char_length(type) >= 2 AND char_length(type) <= 100),
    contract_id UUID REFERENCES contracts(id),
    property_id UUID REFERENCES properties(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Payment_History table
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DOUBLE PRECISION NOT NULL CHECK (amount >= 0),
    payment_method payment_method NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL,
    registrar_role registrar_role NOT NULL,
    registrar UUID REFERENCES staff(id) CHECK (
        (registrar_role = 'staff' AND registrar IS NOT NULL) OR
        (registrar_role = 'tenant' AND registrar IS NULL)
    ),
    expense_id UUID REFERENCES expenses(id),
    payment_id UUID REFERENCES payments(id),
    CHECK (
        (payment_id IS NOT NULL AND expense_id IS NULL) OR
        (payment_id IS NULL AND expense_id IS NOT NULL)
    )
);

-- Charges table
CREATE TABLE charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
    amount DOUBLE PRECISION NOT NULL CHECK (amount >= 0),
    is_taxed BOOLEAN NOT NULL DEFAULT FALSE,
    is_refunded BOOLEAN NOT NULL DEFAULT FALSE,
    payment_id UUID REFERENCES payments(id),
    expense_id UUID REFERENCES expenses(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    CHECK (
        (payment_id IS NOT NULL AND expense_id IS NULL) OR
        (payment_id IS NULL AND expense_id IS NOT NULL)
    )
);

-- Views table
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 100),
    last_name TEXT CHECK (char_length(last_name) >= 1 AND char_length(last_name) <= 100),
    phone_number TEXT CHECK (
        phone_number IS NULL OR (
            char_length(phone_number) >= 8 AND 
            char_length(phone_number) <= 20 AND 
            phone_number ~ '^\+[0-9]+$'
        )
    ),
    email TEXT CHECK (
        email IS NULL OR (
            char_length(email) >= 5 AND 
            char_length(email) <= 255 AND 
            email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        )
    ),
    property_id UUID NOT NULL REFERENCES properties(id),
    room_id UUID REFERENCES rooms(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Function to prevent a tenant from having both individual and company entries
CREATE OR REPLACE FUNCTION prevent_duplicate_tenant_subtype()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_TABLE_NAME = 'individual_tenants' THEN
        IF EXISTS (SELECT 1 FROM company_tenants WHERE tenant_id = NEW.tenant_id) THEN
            RAISE EXCEPTION 'Tenant already exists as a Company tenant. Cannot be both Individual and Company.';
        END IF;
    ELSIF TG_TABLE_NAME = 'company_tenants' THEN
        IF EXISTS (SELECT 1 FROM individual_tenants WHERE tenant_id = NEW.tenant_id) THEN
            RAISE EXCEPTION 'Tenant already exists as an Individual tenant. Cannot be both Individual and Company.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger on individual_tenants to prevent duplicate
CREATE TRIGGER check_individual_tenant_uniqueness
BEFORE INSERT OR UPDATE ON individual_tenants
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_tenant_subtype();

-- Trigger on company_tenants to prevent duplicate
CREATE TRIGGER check_company_tenant_uniqueness
BEFORE INSERT OR UPDATE ON company_tenants
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_tenant_subtype();

ALTER TABLE staff
ADD COLUMN phone_number TEXT NOT NULL CHECK (
  char_length(phone_number) >= 8 AND 
  char_length(phone_number) <= 20 AND 
  phone_number ~ '^\+[0-9]+$'
);


ALTER TABLE properties
DROP CONSTRAINT properties_code_check;

ALTER TABLE properties
ADD CONSTRAINT properties_code_check
CHECK (char_length(code) >= 1 AND char_length(code) <= 50);


-- Create ENUM for initial charge types
CREATE TYPE initial_charge_type AS ENUM (
  'First Month Rental',
  'Earnest Deposit',
  'Security Deposit',
  'Utility Deposit',
  'Legal Fees'
);

-- Property Default Lease Configuration
CREATE TABLE property_default_lease_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Monthly rental default
    default_monthly_rent DOUBLE PRECISION CHECK (default_monthly_rent >= 0),
    
    -- Payment day (1-28)
    default_payment_day INTEGER CHECK (default_payment_day >= 1 AND default_payment_day <= 28),
    
    -- Reminder settings (same as lease table)
    is_expiry_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_days_before_reminder INTEGER CHECK (
        (is_expiry_reminder = TRUE AND expiry_days_before_reminder IS NOT NULL AND expiry_days_before_reminder >= 0) OR
        (is_expiry_reminder = FALSE)
    ),
    is_rent_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    rent_reminder_days_before INTEGER CHECK (
        (is_rent_reminder = TRUE AND rent_reminder_days_before IS NOT NULL AND rent_reminder_days_before >= 0) OR
        (is_rent_reminder = FALSE)
    ),
    is_overdue_rent_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    overdue_days_after_reminder INTEGER CHECK (
        (is_overdue_rent_reminder = TRUE AND overdue_days_after_reminder IS NOT NULL AND overdue_days_after_reminder >= 0) OR
        (is_overdue_rent_reminder = FALSE)
    ),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- One config per property
    UNIQUE(property_id)
);

-- Initial Charges (for new leases)
CREATE TABLE property_default_initial_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    charge_type initial_charge_type NOT NULL,
    amount DOUBLE PRECISION NOT NULL CHECK (amount >= 0),
    is_taxed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    -- One charge type per property
    UNIQUE(property_id, charge_type)
);

-- Late Payment Charges Configuration
CREATE TABLE late_payment_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    days_after_due INTEGER NOT NULL CHECK (days_after_due >= 1 AND days_after_due <= 28),
    amount DOUBLE PRECISION NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    -- Multiple late payment charges per property (different day ranges)
    UNIQUE(property_id, days_after_due)
);

-- Add comments for clarity
COMMENT ON TABLE property_default_lease_config IS 'Default lease configuration for a property - used to pre-fill new lease forms';
COMMENT ON TABLE property_default_initial_charges IS 'Default initial charges when creating a new lease for this property';
COMMENT ON TABLE late_payment_charges IS 'Late payment penalty charges based on days overdue';

COMMENT ON COLUMN property_default_lease_config.default_monthly_rent IS 'Default monthly rent amount for new leases';
COMMENT ON COLUMN property_default_lease_config.default_payment_day IS 'Default payment day (1-28 of each month)';
COMMENT ON COLUMN late_payment_charges.days_after_due IS 'Number of days after payment due date';
COMMENT ON COLUMN late_payment_charges.amount IS 'Late payment charge amount';

-- Create indexes for better performance
CREATE INDEX idx_property_default_config ON property_default_lease_config(property_id);
CREATE INDEX idx_property_initial_charges ON property_default_initial_charges(property_id);
CREATE INDEX idx_late_payment_charges ON late_payment_charges(property_id);

-- Enable RLS on new tables
ALTER TABLE property_default_lease_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_default_initial_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_payment_charges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_default_lease_config
CREATE POLICY "Staff can view property default config in their organization"
ON property_default_lease_config FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_default_lease_config.property_id
    AND properties.organization_id = get_user_org_id()
  )
);

CREATE POLICY "Staff can manage property default config"
ON property_default_lease_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_default_lease_config.property_id
    AND properties.organization_id = get_user_org_id()
  )
);

-- RLS Policies for property_default_initial_charges
CREATE POLICY "Staff can view property default initial charges in their organization"
ON property_default_initial_charges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_default_initial_charges.property_id
    AND properties.organization_id = get_user_org_id()
  )
);

CREATE POLICY "Staff can manage property default initial charges"
ON property_default_initial_charges FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_default_initial_charges.property_id
    AND properties.organization_id = get_user_org_id()
  )
);

-- RLS Policies for late_payment_charges
CREATE POLICY "Staff can view late payment charges in their organization"
ON late_payment_charges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = late_payment_charges.property_id
    AND properties.organization_id = get_user_org_id()
  )
);

CREATE POLICY "Staff can manage late payment charges"
ON late_payment_charges FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = late_payment_charges.property_id
    AND properties.organization_id = get_user_org_id()
  )
);


