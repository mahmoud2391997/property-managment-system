


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."affected_type" AS ENUM (
    'tenant',
    'staff'
);


ALTER TYPE "public"."affected_type" OWNER TO "postgres";


CREATE TYPE "public"."booking_status" AS ENUM (
    'Current',
    'Cancelled',
    'Converted'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."company_expense_type" AS ENUM (
    'Office Rent',
    'ICT Equipment',
    'Office Stationary',
    'Software Subscription',
    'Professional Fees',
    'Bank Charges',
    'Marketing & Advertising',
    'Insurance',
    'Licenses & Government Fees',
    'Plant & Machinery',
    'Company Equipment',
    'Vehicle Repair & Servicing',
    'Transportation',
    'Vehicle Purchase',
    'Property Purchase',
    'Loan',
    'Tax',
    'Miscellaneous/Others'
);


ALTER TYPE "public"."company_expense_type" OWNER TO "postgres";


CREATE TYPE "public"."contract_expense_type" AS ENUM (
    'Rental',
    'Contract Initial Charges'
);


ALTER TYPE "public"."contract_expense_type" OWNER TO "postgres";


CREATE TYPE "public"."contract_rental_period" AS ENUM (
    'Monthly'
);


ALTER TYPE "public"."contract_rental_period" OWNER TO "postgres";


CREATE TYPE "public"."conversion_status_type" AS ENUM (
    'Not Decided',
    'Converted',
    'Not Converted'
);


ALTER TYPE "public"."conversion_status_type" OWNER TO "postgres";


CREATE TYPE "public"."decision" AS ENUM (
    'full',
    'partial',
    'forfeit'
);


ALTER TYPE "public"."decision" OWNER TO "postgres";


CREATE TYPE "public"."expense_category" AS ENUM (
    'Property_Related',
    'Contract_Related',
    'Staff_Related',
    'Company_Related',
    'Purchase_Related'
);


ALTER TYPE "public"."expense_category" OWNER TO "postgres";


CREATE TYPE "public"."identity_type" AS ENUM (
    'mykad',
    'passport'
);


ALTER TYPE "public"."identity_type" OWNER TO "postgres";


CREATE TYPE "public"."initial_charge_type" AS ENUM (
    'First Month Rental',
    'Earnest Deposit',
    'Security Deposit',
    'Utility Deposit',
    'Legal Fees'
);


ALTER TYPE "public"."initial_charge_type" OWNER TO "postgres";


CREATE TYPE "public"."lease_end_schedule_status_type" AS ENUM (
    'Current',
    'Cancelled'
);


ALTER TYPE "public"."lease_end_schedule_status_type" OWNER TO "postgres";


CREATE TYPE "public"."lease_status_new" AS ENUM (
    'Current',
    'Ended'
);


ALTER TYPE "public"."lease_status_new" OWNER TO "postgres";


CREATE TYPE "public"."organization_type" AS ENUM (
    'Owner',
    'Property Manager'
);


ALTER TYPE "public"."organization_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'Cash',
    'Bank Transfer',
    'Online Payment',
    'FPX'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_record_status" AS ENUM (
    'Success',
    'Failed',
    'Pending'
);


ALTER TYPE "public"."payment_record_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'Paid',
    'Pending',
    'Cancelled',
    'Unset'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_type" AS ENUM (
    'Lease Initial Charges',
    'Fines or Penalties',
    'Utilities',
    'Cleaning Service',
    'Parking',
    'Miscellaneous/Others',
    'Rental',
    'Internet Bill',
    'Water Bill',
    'Electricity Bill',
    'Sewerage Bill',
    'Rental Adjustment',
    'Late Payment Charges',
    'Booking'
);


ALTER TYPE "public"."payment_type" OWNER TO "postgres";


CREATE TYPE "public"."performer_type" AS ENUM (
    'staff',
    'tenant',
    'system'
);


ALTER TYPE "public"."performer_type" OWNER TO "postgres";


CREATE TYPE "public"."property_expense_type" AS ENUM (
    'Refund',
    'Agent Commission',
    'Maintenance',
    'Cleaning Service',
    'Internet Bill',
    'Water Bill',
    'Electricity Bill',
    'Sewerage Bill',
    'Management Fees',
    'Renovation',
    'Painting Service',
    'AC Service/Installation',
    'Wiring/Electrical',
    'Plumbing',
    'Miscellaneous/Others'
);


ALTER TYPE "public"."property_expense_type" OWNER TO "postgres";


CREATE TYPE "public"."property_status" AS ENUM (
    'Occupied',
    'Under Preparation',
    'Pending Inspection',
    'Vacant'
);


ALTER TYPE "public"."property_status" OWNER TO "postgres";


CREATE TYPE "public"."property_status_new" AS ENUM (
    'Ready',
    'Pending Inspection',
    'Under Preparation'
);


ALTER TYPE "public"."property_status_new" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'Apartment',
    'House',
    'Commercial Unit',
    'Studio'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."purchase_expense_type" AS ENUM (
    'Furniture',
    'Home Appliances',
    'Office Appliances',
    'Tools',
    'Electrical Items',
    'Plumbing Items',
    'Lighting & Bulbs',
    'Paint & Renovation Materials',
    'Maintenance Consumables',
    'Safety Items',
    'Miscellaneous/Others'
);


ALTER TYPE "public"."purchase_expense_type" OWNER TO "postgres";


CREATE TYPE "public"."recurring_config_type" AS ENUM (
    'Payment',
    'Expense'
);


ALTER TYPE "public"."recurring_config_type" OWNER TO "postgres";


CREATE TYPE "public"."registrar_role" AS ENUM (
    'tenant',
    'staff'
);


ALTER TYPE "public"."registrar_role" OWNER TO "postgres";


CREATE TYPE "public"."reminder_recipient_type" AS ENUM (
    'staff',
    'tenant',
    'role',
    'all_staff',
    'all_tenants'
);


ALTER TYPE "public"."reminder_recipient_type" OWNER TO "postgres";


CREATE TYPE "public"."scheduled_change_status" AS ENUM (
    'Scheduled',
    'Applied',
    'Cancelled'
);


ALTER TYPE "public"."scheduled_change_status" OWNER TO "postgres";


CREATE TYPE "public"."staff_expense_type" AS ENUM (
    'Salary',
    'Allowances',
    'Miscellaneous/Others'
);


ALTER TYPE "public"."staff_expense_type" OWNER TO "postgres";


CREATE TYPE "public"."task_assignment_status" AS ENUM (
    'Pending',
    'Accepted',
    'Rejected',
    'Unassigned',
    'Cancelled'
);


ALTER TYPE "public"."task_assignment_status" OWNER TO "postgres";


CREATE TYPE "public"."task_flow_type" AS ENUM (
    'Lease Ending',
    'Property Not Ready'
);


ALTER TYPE "public"."task_flow_type" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'Low',
    'Medium',
    'High',
    'Urgent'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."task_state" AS ENUM (
    'Open',
    'In Progress',
    'Resolved',
    'Needs Modification'
);


ALTER TYPE "public"."task_state" OWNER TO "postgres";


CREATE TYPE "public"."task_type" AS ENUM (
    'Inspection',
    'Preparation',
    'Refund Request',
    'Refund Finalization',
    'Maintenance',
    'Renovation',
    'Cleaning',
    'Administrative',
    'Documentation',
    'Data Entry',
    'Accounting',
    'Legal',
    'IT Support',
    'Follow Up',
    'Complaint Handling',
    'Miscellaneous/Others'
);


ALTER TYPE "public"."task_type" OWNER TO "postgres";


CREATE TYPE "public"."tenant_type" AS ENUM (
    'Individual',
    'Company'
);


ALTER TYPE "public"."tenant_type" OWNER TO "postgres";


CREATE TYPE "public"."ticket_assignment_status" AS ENUM (
    'Pending',
    'Accepted',
    'Rejected',
    'Unassigned',
    'Cancelled'
);


ALTER TYPE "public"."ticket_assignment_status" OWNER TO "postgres";


CREATE TYPE "public"."ticket_participant_type" AS ENUM (
    'tenant',
    'staff',
    'system'
);


ALTER TYPE "public"."ticket_participant_type" OWNER TO "postgres";


CREATE TYPE "public"."ticket_state" AS ENUM (
    'Open',
    'In Progress',
    'Pending Tenant',
    'Resolved',
    'Closed'
);


ALTER TYPE "public"."ticket_state" OWNER TO "postgres";


CREATE TYPE "public"."time_unit" AS ENUM (
    'Day',
    'Week',
    'Month',
    'Year'
);


ALTER TYPE "public"."time_unit" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_late_payment_charges"() RETURNS TABLE("total_charges_applied" integer, "total_payments_processed" integer, "execution_time_ms" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_charges_applied INTEGER := 0;
  v_payments_processed INTEGER := 0;
  v_rental_payment RECORD;
  v_late_charge RECORD;
  v_days_overdue INTEGER;
  v_new_payment_id UUID;
  v_new_charge_id UUID;
  v_new_reference_id TEXT;
  v_max_reference_number INTEGER;
  v_current_year TEXT;
  v_cron_log_id UUID;
  v_error_message TEXT;
  v_lease_info RECORD;
  v_property_location TEXT;
BEGIN
  v_start_time := clock_timestamp();
  v_current_year := TO_CHAR(NOW(), 'YYYY');
  v_cron_log_id := uuid_generate_v4();

  -- Create initial cron log entry
  INSERT INTO public.cron_logs (
    id,
    job_name,
    executed_at,
    status,
    records_processed,
    charges_applied
  ) VALUES (
    v_cron_log_id,
    'apply-late-payment-charges',
    NOW(),
    'running',
    0,
    0
  );

  BEGIN
    -- Loop through all overdue rental payments
    FOR v_rental_payment IN
      SELECT 
        p.id,
        p.due_payment_timestamp,
        p.lease_id,
        p.organization_id,
        l.reference_id as lease_reference_id,
        l.tenant_id
      FROM public.payments p
      INNER JOIN public.leases l ON p.lease_id = l.id
      WHERE p.type = 'Rental'
        AND p.status = 'Pending'
        AND DATE(p.due_payment_timestamp) < CURRENT_DATE
        AND p.lease_id IS NOT NULL
    LOOP
      -- Calculate days overdue using DATE comparison (ignore time)
      v_days_overdue := (CURRENT_DATE - DATE(v_rental_payment.due_payment_timestamp))::INTEGER;
      
      -- Skip if not overdue (edge case)
      IF v_days_overdue <= 0 THEN
        CONTINUE;
      END IF;

      v_payments_processed := v_payments_processed + 1;

      -- Get lease details for notification message
      SELECT 
        l.reference_id as lease_ref,
        pr.street_address as property_address,
        CASE 
          WHEN r.title IS NOT NULL THEN pr.street_address || ' (' || r.title || ')'
          ELSE pr.street_address
        END as property_location
      INTO v_lease_info
      FROM public.leases l
      INNER JOIN public.properties pr ON l.property_id = pr.id
      LEFT JOIN public.rooms r ON l.room_id = r.id
      WHERE l.id = v_rental_payment.lease_id;

      v_property_location := COALESCE(v_lease_info.property_location, 'your property');

      -- Loop through applicable late charges for this lease
      FOR v_late_charge IN
        SELECT 
          lpc.id,
          lpc.days_after_due,
          lpc.amount
        FROM public.late_payment_charges lpc
        WHERE lpc.lease_id = v_rental_payment.lease_id
          AND lpc.days_after_due <= v_days_overdue
          -- Exclude charges already applied
          AND NOT EXISTS (
            SELECT 1 
            FROM public.payment_late_charges_applied plca
            WHERE plca.rental_payment_id = v_rental_payment.id
              AND plca.late_charge_config_id = lpc.id
          )
        ORDER BY lpc.days_after_due ASC
      LOOP
        -- Generate new payment reference ID (PY-YYYY00000001 format)
        SELECT COALESCE(MAX(
          CAST(SUBSTRING(reference_id FROM 'PY-' || v_current_year || '(.*)') AS INTEGER)
        ), 0) INTO v_max_reference_number
        FROM public.payments
        WHERE organization_id = v_rental_payment.organization_id
          AND reference_id LIKE 'PY-' || v_current_year || '%';

        v_new_reference_id := 'PY-' || v_current_year || LPAD((v_max_reference_number + 1)::TEXT, 8, '0');

        -- Generate UUIDs for new records
        v_new_payment_id := uuid_generate_v4();
        v_new_charge_id := uuid_generate_v4();

        -- Create new late payment charge payment
        INSERT INTO public.payments (
          id,
          type,
          status,
          due_payment_timestamp,
          lease_id,
          organization_id,
          reference_id,
          created_at
        ) VALUES (
          v_new_payment_id,
          'Late Payment Charges',
          'Pending',
          v_rental_payment.due_payment_timestamp,
          v_rental_payment.lease_id,
          v_rental_payment.organization_id,
          v_new_reference_id,
          NOW()
        );

        -- Create charge record for the late payment
        INSERT INTO public.charges (
          id,
          title,
          amount,
          is_taxed,
          is_refunded,
          payment_id,
          created_at
        ) VALUES (
          v_new_charge_id,
          'Late Payment Charge - ' || v_late_charge.days_after_due || ' days',
          v_late_charge.amount,
          false,
          false,
          v_new_payment_id,
          NOW()
        );

        -- Track the applied charge in junction table
        INSERT INTO public.payment_late_charges_applied (
          rental_payment_id,
          late_charge_config_id,
          late_charge_payment_id,
          days_overdue_when_applied,
          organization_id,
          applied_at
        ) VALUES (
          v_rental_payment.id,
          v_late_charge.id,
          v_new_payment_id,
          v_days_overdue,
          v_rental_payment.organization_id,
          NOW()
        );

        -- Create notification for tenant
        INSERT INTO public.notifications (
          organization_id,
          user_id,
          title,
          message,
          reference_id,
          reference_type,
          page,
          is_read,
          created_at
        ) VALUES (
          v_rental_payment.organization_id,
          v_rental_payment.tenant_id,
          'Late Payment Charge Applied',
          'A late payment charge of RM ' || TO_CHAR(v_late_charge.amount, 'FM999,999.00') || 
          ' has been applied to your rental payment for Lease ' || v_lease_info.lease_ref || 
          ' at ' || v_property_location || '. The charge is due to ' || v_days_overdue || 
          ' days overdue payment. Please settle this as soon as possible.',
          v_new_payment_id,
          'payment',
          '/payments/' || v_new_reference_id,
          false,
          NOW()
        );

        v_charges_applied := v_charges_applied + 1;

      END LOOP;

    END LOOP;

    -- Update cron log with success
    UPDATE public.cron_logs
    SET 
      status = 'success',
      records_processed = v_payments_processed,
      charges_applied = v_charges_applied,
      execution_time_ms = EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER
    WHERE id = v_cron_log_id;

    -- Return summary
    RETURN QUERY SELECT 
      v_charges_applied,
      v_payments_processed,
      EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

  EXCEPTION
    WHEN OTHERS THEN
      v_error_message := SQLERRM;
      
      UPDATE public.cron_logs
      SET 
        status = 'error',
        records_processed = v_payments_processed,
        charges_applied = v_charges_applied,
        error_message = v_error_message,
        execution_time_ms = EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER
      WHERE id = v_cron_log_id;
      
      RAISE EXCEPTION 'Error applying late payment charges: %', v_error_message;
  END;
END;
$$;


ALTER FUNCTION "public"."apply_late_payment_charges"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."apply_late_payment_charges"() IS 'Cron job function that automatically applies late payment charges to overdue rental payments. Runs daily to check all pending rental payments and create late charge payments based on configured rules. Uses DATE-based calculation for days overdue (ignores time component). Includes logging and tenant notifications with formatted amounts.';



CREATE OR REPLACE FUNCTION "public"."auto_resolve_stale_pending_tickets"() RETURNS "void"
    LANGUAGE "sql"
    AS $$
  INSERT INTO public.ticket_statuses (state, performer_type, performer_id, ticket_id)
  SELECT
    'Resolved'::public.ticket_state,
    'system'::public.ticket_participant_type,
    NULL,
    t.ticket_id
  FROM (
    SELECT DISTINCT ON (ticket_id)
      ticket_id,
      state,
      created_at
    FROM public.ticket_statuses
    ORDER BY ticket_id, created_at DESC
  ) t
  WHERE t.state = 'Pending Tenant'::public.ticket_state
    AND t.created_at < now() - interval '3 days';
$$;


ALTER FUNCTION "public"."auto_resolve_stale_pending_tickets"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_booking_mutual_exclusivity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only check for Current bookings
    IF NEW.status = 'Current' THEN
        
        -- Case A: Booking is for the whole property (room_id IS NULL)
        IF NEW.room_id IS NULL THEN
            -- Check if any room under this property has a current booking
            IF EXISTS (
                SELECT 1 FROM public.bookings b
                JOIN public.rooms r ON r.id = b.room_id
                WHERE r.property_id = NEW.property_id
                  AND b.status = 'Current'
                  AND b.id IS DISTINCT FROM NEW.id  -- Exclude self on UPDATE
            ) THEN
                RAISE EXCEPTION 'Cannot create property booking: one or more rooms under this property already have current bookings';
            END IF;
            
        -- Case B: Booking is for a room (room_id IS NOT NULL)
        ELSE
            -- Check if the property itself has a current booking
            IF EXISTS (
                SELECT 1 FROM public.bookings
                WHERE property_id = NEW.property_id
                  AND room_id IS NULL
                  AND status = 'Current'
                  AND id IS DISTINCT FROM NEW.id  -- Exclude self on UPDATE
            ) THEN
                RAISE EXCEPTION 'Cannot create room booking: the property already has a current booking';
            END IF;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_booking_mutual_exclusivity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_payment_fulfilled"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_charges NUMERIC;
    total_paid NUMERIC;
    expense_category TEXT;
    staff_expense_type TEXT;
    salary_amount NUMERIC;
BEGIN
    -- Handle rental payments
    IF NEW.payment_id IS NOT NULL THEN
        SELECT COALESCE(SUM(
            CASE 
                WHEN c.is_taxed THEN c.amount * 1.08
                ELSE c.amount
            END
        ), 0)
        INTO total_charges
        FROM charges c
        WHERE c.payment_id = NEW.payment_id;

        SELECT COALESCE(SUM(ph.amount), 0)
        INTO total_paid
        FROM payment_history ph
        WHERE ph.payment_id = NEW.payment_id
        AND ph.status = 'Success';

        IF total_paid >= total_charges THEN
            RAISE EXCEPTION 'Payment is already fulfilled. Total charges: %, Total paid: %', 
                total_charges, total_paid;
        END IF;
    
    -- Handle expense payments
    ELSIF NEW.expense_id IS NOT NULL THEN
        -- Check if this is a salary expense
        SELECT e.category, se.type
        INTO expense_category, staff_expense_type
        FROM expenses e
        LEFT JOIN staff_expenses se ON se.id = e.id
        WHERE e.id = NEW.expense_id;

        IF expense_category = 'Staff_Related' AND staff_expense_type = 'Salary' THEN
            -- Salary: gross + EPF employer + SOCSO employer + allowances (from charges)
            SELECT COALESCE(se.gross_salary + se.epf_employer + se.socso_employer, 0)
            INTO salary_amount
            FROM staff_expenses se
            WHERE se.id = NEW.expense_id;

            SELECT salary_amount + COALESCE(SUM(c.amount), 0)
            INTO total_charges
            FROM charges c
            WHERE c.expense_id = NEW.expense_id;
        ELSE
            -- Regular expense: charges with optional 8% SST
            SELECT COALESCE(SUM(
                CASE 
                    WHEN c.is_taxed THEN c.amount * 1.08
                    ELSE c.amount
                END
            ), 0)
            INTO total_charges
            FROM charges c
            WHERE c.expense_id = NEW.expense_id;
        END IF;

        SELECT COALESCE(SUM(ph.amount), 0)
        INTO total_paid
        FROM payment_history ph
        WHERE ph.expense_id = NEW.expense_id
        AND ph.status = 'Success';

        IF total_paid >= total_charges THEN
            RAISE EXCEPTION 'Expense is already fully paid. Expense amount: %, Total paid: %', 
                total_charges, total_paid;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_payment_fulfilled"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_report_submitter_is_assigned"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM task_assignments
        WHERE task_id = NEW.task_id
        AND assigned_id = NEW.submitted_by
        AND status = 'Accepted'
    ) THEN
        RAISE EXCEPTION 'Only the assigned staff can submit a report for this task';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_report_submitter_is_assigned"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_contract_rental_expenses"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  contract_rec RECORD;
  v_latest_due DATE;
  v_ref_date DATE;
  v_next_due DATE;
  v_temp_date DATE;
  v_gen_date DATE;
  v_expense_id UUID;
  v_ref_id TEXT;
  v_latest_seq BIGINT;
  v_year_prefix TEXT;
  v_safety_counter INT;
BEGIN
  v_year_prefix := 'XP-' || EXTRACT(YEAR FROM NOW())::INT::TEXT;

  FOR contract_rec IN
    SELECT
      c.id,
      c.organization_id,
      c.created_by,
      c.payment_day,
      c.monthly_rent,
      c.frequency,
      c.lead_days,
      c.billing_cycle_start_month,
      c.start_date,
      c.number_of_months
    FROM public.contracts c
    WHERE c.status = 'Current'
  LOOP
    v_safety_counter := 0;

    SELECT MAX(e.due_payment_date)::DATE INTO v_latest_due
    FROM public.contract_expenses ce
    JOIN public.expenses e ON e.id = ce.id
    WHERE ce.contract_id = contract_rec.id
      AND ce.type = 'Rental'
      AND ce.is_first_rental = FALSE;

    IF v_latest_due IS NOT NULL THEN
      v_ref_date := v_latest_due;
    ELSE
      v_ref_date := date_trunc('month', contract_rec.billing_cycle_start_month)::DATE - INTERVAL '1 day';
    END IF;

    LOOP
      v_safety_counter := v_safety_counter + 1;
      IF v_safety_counter > 24 THEN EXIT; END IF;

      v_next_due := make_date(
        EXTRACT(YEAR FROM contract_rec.billing_cycle_start_month)::INT,
        EXTRACT(MONTH FROM contract_rec.billing_cycle_start_month)::INT,
        LEAST(contract_rec.payment_day, 28)
      );

      WHILE v_next_due <= v_ref_date LOOP
        v_temp_date := (v_next_due + contract_rec.frequency * INTERVAL '1 month')::DATE;
        v_next_due := make_date(
          EXTRACT(YEAR FROM v_temp_date)::INT,
          EXTRACT(MONTH FROM v_temp_date)::INT,
          LEAST(contract_rec.payment_day, 28)
        );
      END LOOP;

      v_gen_date := v_next_due - contract_rec.lead_days;
      IF CURRENT_DATE < v_gen_date THEN
        EXIT;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public.contract_expenses ce
        JOIN public.expenses e ON e.id = ce.id
        WHERE ce.contract_id = contract_rec.id
          AND ce.type = 'Rental'
          AND ce.is_first_rental = FALSE
          AND date_trunc('month', e.due_payment_date) = date_trunc('month', v_next_due::timestamp)
      ) THEN
        v_ref_date := v_next_due;
        CONTINUE;
      END IF;

      SELECT COALESCE(MAX(SUBSTRING(reference_id FROM 8)::BIGINT), 0) + 1
      INTO v_latest_seq
      FROM public.expenses
      WHERE organization_id = contract_rec.organization_id
        AND reference_id LIKE v_year_prefix || '%';

      v_ref_id := v_year_prefix || LPAD(v_latest_seq::TEXT, 8, '0');
      v_expense_id := gen_random_uuid();

      INSERT INTO public.expenses
        (id, reference_id, category, status, due_payment_date, organization_id, created_by)
      VALUES (
        v_expense_id,
        v_ref_id,
        'Contract_Related',
        'Pending',
        v_next_due::TIMESTAMPTZ,
        contract_rec.organization_id,
        contract_rec.created_by
      );

      INSERT INTO public.charges
        (id, title, amount, is_taxed, is_refunded, expense_id, created_by)
      VALUES (
        gen_random_uuid(),
        'Monthly Rental',
        contract_rec.monthly_rent,
        FALSE,
        FALSE,
        v_expense_id,
        contract_rec.created_by
      );

      INSERT INTO public.contract_expenses (id, contract_id, type, is_first_rental)
      VALUES (
        v_expense_id,
        contract_rec.id,
        'Rental',
        FALSE
      );

      v_ref_date := v_next_due;

    END LOOP;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_contract_rental_expenses"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_next_rental_payment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_lease RECORD;
    v_new_payment_id UUID;
    v_new_reference_id TEXT;
    v_next_due_date TIMESTAMPTZ;
    v_last_due_date TIMESTAMPTZ;
    v_scheduled_change RECORD;
    v_rent_amount DECIMAL;
BEGIN
    -- Only proceed if status is 'Paid'
    IF NEW.status NOT IN ('Paid') THEN
        RETURN NEW;
    END IF;
    
    -- Only for Rental type payments
    IF NEW.type != 'Rental' THEN
        RETURN NEW;
    END IF;
    
    -- Only proceed if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Skip if current payment has no due date
    IF NEW.due_payment_timestamp IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get the lease and check it's not ended
    SELECT * INTO v_lease
    FROM public.leases
    WHERE id = NEW.lease_id
      AND status != 'Ended';
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Find the latest due_payment_timestamp among all Rental payments for this lease
    SELECT MAX(due_payment_timestamp) INTO v_last_due_date
    FROM public.payments
    WHERE lease_id = NEW.lease_id
      AND type = 'Rental';
    
    -- Calculate next due date: month after the latest existing payment, using lease's payment_day
    v_next_due_date := DATE_TRUNC('month', v_last_due_date) 
                       + INTERVAL '1 month' 
                       + ((v_lease.payment_day - 1) || ' days')::INTERVAL;
    
    -- Check if there's a scheduled rental change for the next cycle
    SELECT * INTO v_scheduled_change
    FROM public.scheduled_rental_changes
    WHERE lease_id = NEW.lease_id
      AND status = 'Scheduled'
      AND DATE_TRUNC('month', effective_from) = DATE_TRUNC('month', v_next_due_date);
    
    -- If found, apply the change FIRST (update lease and mark as applied)
    IF FOUND THEN
        UPDATE public.leases
        SET monthly_rent = v_scheduled_change.new_monthly_rent
        WHERE id = NEW.lease_id;
        
        UPDATE public.scheduled_rental_changes
        SET status = 'Applied',
            applied_at = NOW()
        WHERE id = v_scheduled_change.id;
        
        -- Use the new rent amount
        v_rent_amount := v_scheduled_change.new_monthly_rent;
    ELSE
        -- Use current lease monthly_rent
        v_rent_amount := v_lease.monthly_rent;
    END IF;
    
    -- Generate new reference_id
    SELECT 'PY-' || TO_CHAR(NOW(), 'YYYY') || LPAD((
        COALESCE(
            MAX(SUBSTRING(reference_id FROM 8)::INT), 0
        ) + 1
    )::TEXT, 8, '0')
    INTO v_new_reference_id
    FROM public.payments
    WHERE organization_id = NEW.organization_id
      AND reference_id LIKE 'PY-' || TO_CHAR(NOW(), 'YYYY') || '%';
    
    -- Create new payment with the correct rent amount
    INSERT INTO public.payments (
        id,
        due_payment_timestamp,
        lease_id,
        organization_id,
        created_at,
        created_by,
        status,
        type,
        reference_id
    ) VALUES (
        uuid_generate_v4(),
        v_next_due_date,
        NEW.lease_id,
        NEW.organization_id,
        NOW(),
        NEW.created_by,
        'Pending',
        'Rental',
        v_new_reference_id
    )
    RETURNING id INTO v_new_payment_id;
    
    -- Create the charge for monthly rent
    INSERT INTO public.charges (
        id,
        title,
        amount,
        is_taxed,
        is_refunded,
        payment_id,
        created_at,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        'Monthly Rental',
        v_rent_amount,
        FALSE,
        FALSE,
        v_new_payment_id,
        NOW(),
        NEW.created_by
    );
    
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."generate_next_rental_payment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_recurring_expenses"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  rc RECORD;
  v_original RECORD;
  v_original_pe RECORD;
  v_original_ce RECORD;
  v_latest_due DATE;
  v_next_due DATE;
  v_gen_date DATE;
  v_expense_id UUID;
  v_ref_id TEXT;
  v_latest_seq BIGINT;
  v_year_prefix TEXT;
  v_due_day INT;
  v_safety_counter INT;
  v_charge RECORD;
  v_status payment_status;
BEGIN
  v_year_prefix := 'XP-' || EXTRACT(YEAR FROM NOW())::INT::TEXT;

  FOR rc IN
    SELECT
      r.id,
      r.organization_id,
      r.created_by,
      r.event_on,
      r.offset_days,
      r.is_payment_fixed
    FROM public.recurring_configs r
    WHERE r.is_active = TRUE
      AND r.type = 'Expense'
      AND r.event_on IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.recurring_config_id = r.id
      )
  LOOP
    v_safety_counter := 0;
    v_due_day := LEAST(rc.event_on::INT, 28);

    SELECT e.id, e.category
    INTO v_original
    FROM public.expenses e
    WHERE e.recurring_config_id = rc.id
    ORDER BY e.created_at DESC
    LIMIT 1;

    IF v_original.category = 'Property_Related' THEN
      SELECT pe.property_id, pe.lease_id, pe.type
      INTO v_original_pe
      FROM public.property_expenses pe
      WHERE pe.id = v_original.id;

      IF v_original_pe.lease_id IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.leases l
          WHERE l.id = v_original_pe.lease_id
            AND l.status = 'Current'
        ) THEN
          CONTINUE;
        END IF;
      END IF;

    ELSIF v_original.category = 'Company_Related' THEN
      SELECT ce.type
      INTO v_original_ce
      FROM public.company_expenses ce
      WHERE ce.id = v_original.id;
    END IF;

    SELECT MAX(COALESCE(e.due_payment_date::DATE, ph.paid_at::DATE)) INTO v_latest_due
    FROM public.expenses e
    LEFT JOIN payment_history ph ON ph.expense_id = e.id
    WHERE e.recurring_config_id = rc.id
      AND (e.due_payment_date IS NOT NULL OR ph.paid_at IS NOT NULL);

    IF v_latest_due IS NULL THEN
      v_latest_due := make_date(
        EXTRACT(YEAR FROM NOW())::INT,
        EXTRACT(MONTH FROM NOW())::INT,
        v_due_day
      );
      IF v_latest_due > CURRENT_DATE THEN
        v_latest_due := (v_latest_due - INTERVAL '1 month')::DATE;
      END IF;
    END IF;

    LOOP
      v_safety_counter := v_safety_counter + 1;
      IF v_safety_counter > 12 THEN EXIT; END IF;

      v_next_due := make_date(
        EXTRACT(YEAR FROM (v_latest_due + INTERVAL '1 month'))::INT,
        EXTRACT(MONTH FROM (v_latest_due + INTERVAL '1 month'))::INT,
        v_due_day
      );

      v_gen_date := v_next_due - rc.offset_days;

      IF CURRENT_DATE < v_gen_date THEN
        EXIT;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public.expenses e
        LEFT JOIN payment_history ph ON ph.expense_id = e.id
        WHERE e.recurring_config_id = rc.id
          AND date_trunc('month', COALESCE(e.due_payment_date, ph.paid_at)) = date_trunc('month', v_next_due::TIMESTAMP)
      ) THEN
        v_latest_due := v_next_due;
        CONTINUE;
      END IF;

      SELECT COALESCE(MAX(SUBSTRING(reference_id FROM 8)::BIGINT), 0) + 1
      INTO v_latest_seq
      FROM public.expenses
      WHERE organization_id = rc.organization_id
        AND reference_id LIKE v_year_prefix || '%';

      v_ref_id := v_year_prefix || LPAD(v_latest_seq::TEXT, 8, '0');
      v_expense_id := gen_random_uuid();

      IF rc.is_payment_fixed THEN
        v_status := 'Pending';
      ELSE
        v_status := 'Unset';
      END IF;

      INSERT INTO public.expenses
        (id, reference_id, category, status, due_payment_date,
         organization_id, created_by, recurring_config_id)
      VALUES (
        v_expense_id,
        v_ref_id,
        v_original.category,
        v_status,
        v_next_due::TIMESTAMPTZ,
        rc.organization_id,
        rc.created_by,
        rc.id
      );

      IF rc.is_payment_fixed THEN
        FOR v_charge IN
          SELECT title, amount, is_taxed, is_refunded, created_by
          FROM public.charges
          WHERE expense_id = v_original.id
        LOOP
          INSERT INTO public.charges
            (id, title, amount, is_taxed, is_refunded, expense_id, created_by)
          VALUES (
            gen_random_uuid(),
            v_charge.title,
            v_charge.amount,
            v_charge.is_taxed,
            v_charge.is_refunded,
            v_expense_id,
            v_charge.created_by
          );
        END LOOP;
      END IF;

      IF v_original.category = 'Property_Related' THEN
        INSERT INTO public.property_expenses (id, property_id, lease_id, type)
        VALUES (
          v_expense_id,
          v_original_pe.property_id,
          v_original_pe.lease_id,
          v_original_pe.type
        );

      ELSIF v_original.category = 'Company_Related' THEN
        INSERT INTO public.company_expenses (id, type)
        VALUES (v_expense_id, v_original_ce.type);
      END IF;

      v_latest_due := v_next_due;
    END LOOP;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_recurring_expenses"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_org_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT organization_id FROM staff WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."get_user_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_self_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.assigner_id = NEW.assigned_id THEN
    NEW.status := 'Accepted';
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_self_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff
    JOIN roles ON staff.role_id = roles.id
    JOIN roles_permissions ON roles.id = roles_permissions.role_id
    JOIN permissions ON roles_permissions.permission_id = permissions.id
    WHERE staff.id = auth.uid()
    AND permissions.module = 'admin'
    AND permissions.action = '*'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff_in_org"("org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
    AND staff.organization_id = org_id
  );
END;
$$;


ALTER FUNCTION "public"."is_staff_in_org"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_tenant"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenants WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_tenant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_daily_occupancy"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_today        DATE := CURRENT_DATE;
  v_prop_count   INT;
  v_room_count   INT;
  v_occ_prop     INT;
  v_occ_rooms    INT;
  v_rate         NUMERIC(5,2);
BEGIN
  DELETE FROM financial_daily_occupancy
  WHERE date = v_today AND organization_id = p_org_id;

  SELECT COUNT(*) INTO v_prop_count
  FROM properties WHERE organization_id = p_org_id;

  SELECT COUNT(*) INTO v_room_count
  FROM rooms r JOIN properties p ON r.property_id = p.id
  WHERE p.organization_id = p_org_id;

  SELECT COUNT(DISTINCT l.property_id) INTO v_occ_prop
  FROM leases l JOIN properties p ON l.property_id = p.id
  WHERE p.organization_id = p_org_id
    AND l.status = 'Current';

  SELECT COUNT(DISTINCT l.room_id) INTO v_occ_rooms
  FROM leases l JOIN properties p ON l.property_id = p.id
  WHERE p.organization_id = p_org_id
    AND l.room_id IS NOT NULL
    AND l.status = 'Current';

  IF (v_prop_count + v_room_count) > 0 THEN
    v_rate := ROUND(((v_occ_prop + v_occ_rooms)::numeric / (v_prop_count + v_room_count)::numeric) * 100, 2);
  ELSE v_rate := 0;
  END IF;

  INSERT INTO financial_daily_occupancy (
    date, organization_id, properties_count, rooms_count,
    properties_leased_count, rooms_leased_count, occupancy_rate
  ) VALUES (
    v_today, p_org_id, v_prop_count, v_room_count,
    v_occ_prop, v_occ_rooms, v_rate
  );
END;
$$;


ALTER FUNCTION "public"."populate_daily_occupancy"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_monthly_expense_category"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM financial_daily_expense_category WHERE organization_id = p_org_id;

  INSERT INTO financial_daily_expense_category (date, organization_id, category, amount)
  SELECT date_trunc('month', sub.effective_date)::date, p_org_id, sub.category, SUM(sub.amt)
  FROM (
    SELECT e.due_payment_date AS effective_date, e.category::text AS category, c.amount AS amt
    FROM expenses e JOIN charges c ON c.expense_id = e.id
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND e.category != 'Staff_Related'
      AND e.due_payment_date IS NOT NULL

    UNION ALL

    SELECT ph.paid_at, e.category::text, c.amount
    FROM expenses e JOIN charges c ON c.expense_id = e.id
    JOIN payment_history ph ON ph.expense_id = e.id AND ph.status = 'Success'
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND e.category != 'Staff_Related'
      AND e.due_payment_date IS NULL

    UNION ALL

    SELECT e.due_payment_date, e.category::text,
      (se.gross_salary + se.epf_employer + se.socso_employer)
    FROM expenses e JOIN staff_expenses se ON se.id = e.id
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND e.category = 'Staff_Related' AND e.due_payment_date IS NOT NULL

    UNION ALL

    SELECT e.due_payment_date, e.category::text, c.amount
    FROM expenses e JOIN charges c ON c.expense_id = e.id
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND e.category = 'Staff_Related' AND e.due_payment_date IS NOT NULL

    UNION ALL

    SELECT ph.paid_at, e.category::text,
      (se.gross_salary + se.epf_employer + se.socso_employer)
    FROM expenses e JOIN staff_expenses se ON se.id = e.id
    JOIN payment_history ph ON ph.expense_id = e.id AND ph.status = 'Success'
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND e.category = 'Staff_Related' AND e.due_payment_date IS NULL

    UNION ALL

    SELECT ph.paid_at, e.category::text, c.amount
    FROM expenses e JOIN charges c ON c.expense_id = e.id
    JOIN payment_history ph ON ph.expense_id = e.id AND ph.status = 'Success'
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND e.category = 'Staff_Related' AND e.due_payment_date IS NULL
  ) sub
  GROUP BY date_trunc('month', sub.effective_date), sub.category;
END;
$$;


ALTER FUNCTION "public"."populate_monthly_expense_category"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_monthly_payment_type"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM financial_daily_payment_type WHERE organization_id = p_org_id;

  INSERT INTO financial_daily_payment_type (date, organization_id, project_id, type, amount)
  SELECT date_trunc('month', sub.paid_at)::date, p_org_id, sub.project_id, sub.pay_type, SUM(sub.amt)
  FROM (
    SELECT ph.paid_at, prop.project_id, pay.type::text AS pay_type, ph.amount AS amt
    FROM payment_history ph
    JOIN payments pay    ON ph.payment_id = pay.id
    JOIN leases l        ON pay.lease_id  = l.id
    JOIN properties prop ON l.property_id = prop.id
    WHERE pay.organization_id = p_org_id AND ph.status = 'Success'

    UNION ALL

    SELECT ph.paid_at, prop.project_id, pay.type::text, ph.amount
    FROM payment_history ph
    JOIN payments pay    ON ph.payment_id  = pay.id
    JOIN bookings b      ON pay.booking_id = b.id
    JOIN properties prop ON b.property_id  = prop.id
    WHERE pay.organization_id = p_org_id AND ph.status = 'Success'
  ) sub
  GROUP BY date_trunc('month', sub.paid_at), sub.project_id, sub.pay_type;
END;
$$;


ALTER FUNCTION "public"."populate_monthly_payment_type"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_monthly_property"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_start_month   DATE;
  v_current_month DATE;
  v_loop_month    DATE;
  v_month_start   TIMESTAMPTZ;
  v_month_end     TIMESTAMPTZ;
BEGIN
  SELECT date_trunc('month', MIN(paid_at::date))::date INTO v_start_month
  FROM payment_history ph
  LEFT JOIN payments pay ON ph.payment_id = pay.id
  LEFT JOIN expenses e ON ph.expense_id = e.id
  WHERE COALESCE(pay.organization_id, e.organization_id) = p_org_id
    AND ph.status = 'Success';

  IF v_start_month IS NULL THEN RETURN; END IF;
  v_current_month := date_trunc('month', CURRENT_DATE)::date;

  DELETE FROM financial_daily_property
  WHERE property_id IN (SELECT id FROM properties WHERE organization_id = p_org_id);

  v_loop_month := v_start_month;
  WHILE v_loop_month <= v_current_month LOOP
    v_month_start := v_loop_month::timestamptz;
    v_month_end   := (v_loop_month + INTERVAL '1 month')::timestamptz;

    WITH
    lease_income AS (
      SELECT l.property_id, SUM(ph.amount) AS amt
      FROM payment_history ph
      JOIN payments pay ON ph.payment_id = pay.id
      JOIN leases l ON pay.lease_id = l.id
      WHERE pay.organization_id = p_org_id AND ph.status = 'Success'
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
      GROUP BY l.property_id
    ),
    booking_income AS (
      SELECT b.property_id, SUM(ph.amount) AS amt
      FROM payment_history ph
      JOIN payments pay ON ph.payment_id = pay.id
      JOIN bookings b ON pay.booking_id = b.id
      WHERE pay.organization_id = p_org_id AND ph.status = 'Success'
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
      GROUP BY b.property_id
    ),
    rental_recv AS (
      SELECT l.property_id, SUM(ph.amount) AS amt
      FROM payment_history ph
      JOIN payments pay ON ph.payment_id = pay.id
      JOIN leases l ON pay.lease_id = l.id
      WHERE pay.organization_id = p_org_id AND pay.type = 'Rental'
        AND ph.status = 'Success'
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
      GROUP BY l.property_id
    ),
    owner_paid AS (
      SELECT ct.property_id, SUM(ph.amount) AS amt
      FROM payment_history ph
      JOIN expenses e ON ph.expense_id = e.id
      JOIN contract_expenses ce ON ce.id = e.id
      JOIN contracts ct ON ce.contract_id = ct.id
      WHERE e.organization_id = p_org_id AND ce.type = 'Rental'
        AND ph.status = 'Success'
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
      GROUP BY ct.property_id
    ),
    prop_exp AS (
      SELECT pe.property_id, SUM(ph.amount) AS amt
      FROM payment_history ph
      JOIN expenses e ON ph.expense_id = e.id
      JOIN property_expenses pe ON pe.id = e.id
      WHERE e.organization_id = p_org_id AND pe.property_id IS NOT NULL
        AND ph.status = 'Success'
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
      GROUP BY pe.property_id
    ),
    purch_exp AS (
      SELECT pue.property_id, SUM(ph.amount) AS amt
      FROM payment_history ph
      JOIN expenses e ON ph.expense_id = e.id
      JOIN purchase_expenses pue ON pue.id = e.id
      WHERE e.organization_id = p_org_id AND pue.property_id IS NOT NULL
        AND ph.status = 'Success'
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
      GROUP BY pue.property_id
    ),
    contr_exp AS (
      SELECT ct.property_id, SUM(ph.amount) AS amt
      FROM payment_history ph
      JOIN expenses e ON ph.expense_id = e.id
      JOIN contract_expenses ce ON ce.id = e.id
      JOIN contracts ct ON ce.contract_id = ct.id
      WHERE e.organization_id = p_org_id AND ph.status = 'Success'
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
      GROUP BY ct.property_id
    )
    INSERT INTO financial_daily_property (
      date, property_id, organization_id,
      income, outcome, rental_received, owner_paid
    )
    SELECT
      v_loop_month, prop.id, p_org_id,
      COALESCE(li.amt, 0) + COALESCE(bi.amt, 0),
      COALESCE(pe.amt, 0) + COALESCE(pue.amt, 0) + COALESCE(ce.amt, 0),
      COALESCE(rr.amt, 0),
      COALESCE(op.amt, 0)
    FROM properties prop
    LEFT JOIN lease_income   li  ON li.property_id  = prop.id
    LEFT JOIN booking_income bi  ON bi.property_id  = prop.id
    LEFT JOIN rental_recv    rr  ON rr.property_id  = prop.id
    LEFT JOIN owner_paid     op  ON op.property_id  = prop.id
    LEFT JOIN prop_exp       pe  ON pe.property_id  = prop.id
    LEFT JOIN purch_exp      pue ON pue.property_id = prop.id
    LEFT JOIN contr_exp      ce  ON ce.property_id  = prop.id
    WHERE prop.organization_id = p_org_id;

    v_loop_month := (v_loop_month + INTERVAL '1 month')::date;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."populate_monthly_property"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_monthly_property_expense"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM financial_daily_property_expense
  WHERE property_id IN (SELECT id FROM properties WHERE organization_id = p_org_id);

  INSERT INTO financial_daily_property_expense (date, property_id, organization_id, category, type, amount)
  SELECT date_trunc('month', sub.effective_date)::date, sub.property_id, p_org_id,
         sub.category, sub.expense_type, SUM(sub.amt)
  FROM (
    SELECT e.due_payment_date AS effective_date, pe.property_id,
           'Property_Related'::text AS category, pe.type::text AS expense_type, c.amount AS amt
    FROM expenses e JOIN property_expenses pe ON pe.id = e.id JOIN charges c ON c.expense_id = e.id
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND pe.property_id IS NOT NULL AND e.due_payment_date IS NOT NULL

    UNION ALL

    SELECT ph.paid_at, pe.property_id,
           'Property_Related'::text, pe.type::text, c.amount
    FROM expenses e JOIN property_expenses pe ON pe.id = e.id JOIN charges c ON c.expense_id = e.id
    JOIN payment_history ph ON ph.expense_id = e.id AND ph.status = 'Success'
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND pe.property_id IS NOT NULL AND e.due_payment_date IS NULL

    UNION ALL

    SELECT e.due_payment_date, pue.property_id,
           'Purchase_Related'::text, pue.type::text, c.amount
    FROM expenses e JOIN purchase_expenses pue ON pue.id = e.id JOIN charges c ON c.expense_id = e.id
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND pue.property_id IS NOT NULL AND e.due_payment_date IS NOT NULL

    UNION ALL

    SELECT ph.paid_at, pue.property_id,
           'Purchase_Related'::text, pue.type::text, c.amount
    FROM expenses e JOIN purchase_expenses pue ON pue.id = e.id JOIN charges c ON c.expense_id = e.id
    JOIN payment_history ph ON ph.expense_id = e.id AND ph.status = 'Success'
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND pue.property_id IS NOT NULL AND e.due_payment_date IS NULL

    UNION ALL

    SELECT e.due_payment_date, ct.property_id,
           'Contract_Related'::text, ce.type::text, c.amount
    FROM expenses e JOIN contract_expenses ce ON ce.id = e.id
    JOIN contracts ct ON ce.contract_id = ct.id JOIN charges c ON c.expense_id = e.id
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND e.due_payment_date IS NOT NULL

    UNION ALL

    SELECT ph.paid_at, ct.property_id,
           'Contract_Related'::text, ce.type::text, c.amount
    FROM expenses e JOIN contract_expenses ce ON ce.id = e.id
    JOIN contracts ct ON ce.contract_id = ct.id JOIN charges c ON c.expense_id = e.id
    JOIN payment_history ph ON ph.expense_id = e.id AND ph.status = 'Success'
    WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
      AND e.due_payment_date IS NULL
  ) sub
  GROUP BY date_trunc('month', sub.effective_date), sub.property_id, sub.category, sub.expense_type;
END;
$$;


ALTER FUNCTION "public"."populate_monthly_property_expense"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_monthly_summary"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_start_month   DATE;
  v_current_month DATE;
  v_loop_month    DATE;
  v_month_start   TIMESTAMPTZ;
  v_month_end     TIMESTAMPTZ;
  v_snapshot      TIMESTAMPTZ;
  v_total_income  NUMERIC(12,2);
  v_total_outcome NUMERIC(12,2);
  v_rental_due    NUMERIC(12,2);
  v_rental_received NUMERIC(12,2);
  v_owner_paid    NUMERIC(12,2);
  v_ro_amount     NUMERIC(12,2);
  v_ro_count      INT;
  v_ro_this_month NUMERIC(12,2);
  v_ro_prev       NUMERIC(12,2);
  v_exp_total     NUMERIC(12,2);
  v_exp_paid      NUMERIC(12,2);
  v_eo_amount     NUMERIC(12,2);
  v_eo_count      INT;
  v_eo_this_month NUMERIC(12,2);
  v_eo_prev       NUMERIC(12,2);
BEGIN
  SELECT date_trunc('month', MIN(d))::date INTO v_start_month
  FROM (
    SELECT MIN(due_payment_timestamp::date) AS d FROM payments WHERE organization_id = p_org_id
    UNION ALL
    SELECT MIN(COALESCE(due_payment_date, created_at)::date) FROM expenses WHERE organization_id = p_org_id
    UNION ALL
    SELECT MIN(paid_at::date) FROM payment_history ph JOIN payments p ON ph.payment_id = p.id WHERE p.organization_id = p_org_id
    UNION ALL
    SELECT MIN(paid_at::date) FROM payment_history ph JOIN expenses e ON ph.expense_id = e.id WHERE e.organization_id = p_org_id
  ) sub;

  IF v_start_month IS NULL THEN RETURN; END IF;
  v_current_month := date_trunc('month', CURRENT_DATE)::date;

  DELETE FROM financial_daily_summary WHERE organization_id = p_org_id;

  v_loop_month := v_start_month;
  WHILE v_loop_month <= v_current_month LOOP
    v_month_start := v_loop_month::timestamptz;
    v_month_end   := (v_loop_month + INTERVAL '1 month')::timestamptz;
    v_snapshot    := CASE
      WHEN v_loop_month = v_current_month THEN NOW()
      ELSE (v_loop_month + INTERVAL '1 month' - INTERVAL '1 day')::timestamptz
    END;

    -- total_income
    SELECT COALESCE(SUM(ph.amount), 0) INTO v_total_income
    FROM payment_history ph
    JOIN payments pay ON ph.payment_id = pay.id
    WHERE pay.organization_id = p_org_id
      AND ph.status = 'Success'
      AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end;

    -- total_outcome
    SELECT COALESCE(SUM(ph.amount), 0) INTO v_total_outcome
    FROM payment_history ph
    JOIN expenses e ON ph.expense_id = e.id
    WHERE e.organization_id = p_org_id
      AND ph.status = 'Success'
      AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end;

    -- rental_due
    SELECT COALESCE(SUM(c.amount), 0) INTO v_rental_due
    FROM payments pay JOIN charges c ON c.payment_id = pay.id
    WHERE pay.organization_id = p_org_id AND pay.type = 'Rental'
      AND pay.due_payment_timestamp >= v_month_start
      AND pay.due_payment_timestamp < v_month_end;

    -- rental_received
    SELECT COALESCE(SUM(ph.amount), 0) INTO v_rental_received
    FROM payment_history ph
    JOIN payments pay ON ph.payment_id = pay.id
    WHERE pay.organization_id = p_org_id
      AND pay.type = 'Rental'
      AND pay.status != 'Cancelled'
      AND pay.due_payment_timestamp >= v_month_start
      AND pay.due_payment_timestamp < v_month_end
      AND ph.status = 'Success'
      AND ph.paid_at <= v_snapshot;

    -- owner_paid
    SELECT COALESCE(SUM(ph.amount), 0) INTO v_owner_paid
    FROM payment_history ph
    JOIN expenses e ON ph.expense_id = e.id
    JOIN contract_expenses ce ON ce.id = e.id
    WHERE e.organization_id = p_org_id AND ce.type = 'Rental'
      AND ph.status = 'Success'
      AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end;

    -- rental overdue (flat aggregate)
    SELECT
      COALESCE(SUM(c.amount), 0) - COALESCE((
        SELECT SUM(ph.amount)
        FROM payment_history ph
        JOIN payments p2 ON ph.payment_id = p2.id
        WHERE p2.organization_id = p_org_id
          AND p2.type = 'Rental'
          AND p2.status = 'Pending'
          AND p2.due_payment_timestamp < v_snapshot
          AND ph.status = 'Success'
      ), 0),
      COUNT(DISTINCT p.id)
    INTO v_ro_amount, v_ro_count
    FROM charges c
    JOIN payments p ON c.payment_id = p.id
    WHERE p.organization_id = p_org_id
      AND p.type = 'Rental'
      AND p.status = 'Pending'
      AND p.due_payment_timestamp < v_snapshot;

    -- rental overdue this month (flat aggregate)
    SELECT
      COALESCE(SUM(c.amount), 0) - COALESCE((
        SELECT SUM(ph.amount)
        FROM payment_history ph
        JOIN payments p2 ON ph.payment_id = p2.id
        WHERE p2.organization_id = p_org_id
          AND p2.type = 'Rental'
          AND p2.status = 'Pending'
          AND p2.due_payment_timestamp < v_snapshot
          AND p2.due_payment_timestamp >= v_month_start
          AND ph.status = 'Success'
      ), 0)
    INTO v_ro_this_month
    FROM charges c
    JOIN payments p ON c.payment_id = p.id
    WHERE p.organization_id = p_org_id
      AND p.type = 'Rental'
      AND p.status = 'Pending'
      AND p.due_payment_timestamp < v_snapshot
      AND p.due_payment_timestamp >= v_month_start;

    v_ro_prev := v_ro_amount - v_ro_this_month;

    -- expense_total
    WITH this_month_exp AS (
      SELECT e.id, e.category, e.status
      FROM expenses e
      WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
        AND e.due_payment_date IS NOT NULL
        AND e.due_payment_date >= v_month_start AND e.due_payment_date < v_month_end
      UNION
      SELECT DISTINCT e.id, e.category, e.status
      FROM expenses e
      JOIN payment_history ph ON ph.expense_id = e.id AND ph.status = 'Success'
      WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
        AND e.due_payment_date IS NULL
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
    ),
    exp_amounts AS (
      SELECT em.id, COALESCE(SUM(c.amount), 0) AS amt
      FROM this_month_exp em JOIN charges c ON c.expense_id = em.id
      WHERE em.category != 'Staff_Related'
      GROUP BY em.id
      UNION ALL
      SELECT em.id,
        (se.gross_salary + se.epf_employer + se.socso_employer + COALESCE(SUM(c.amount), 0))
      FROM this_month_exp em
      JOIN staff_expenses se ON se.id = em.id
      LEFT JOIN charges c ON c.expense_id = em.id
      WHERE em.category = 'Staff_Related'
      GROUP BY em.id, se.gross_salary, se.epf_employer, se.socso_employer
    )
    SELECT COALESCE(SUM(amt), 0) INTO v_exp_total FROM exp_amounts;

    -- expense_paid
    WITH this_month_exp AS (
      SELECT e.id
      FROM expenses e
      WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
        AND e.due_payment_date IS NOT NULL
        AND e.due_payment_date >= v_month_start AND e.due_payment_date < v_month_end
      UNION
      SELECT DISTINCT e.id
      FROM expenses e
      JOIN payment_history ph ON ph.expense_id = e.id AND ph.status = 'Success'
      WHERE e.organization_id = p_org_id AND e.status != 'Cancelled'
        AND e.due_payment_date IS NULL
        AND ph.paid_at >= v_month_start AND ph.paid_at < v_month_end
    )
    SELECT COALESCE(SUM(ph.amount), 0) INTO v_exp_paid
    FROM payment_history ph
    WHERE ph.expense_id IN (SELECT id FROM this_month_exp)
      AND ph.status = 'Success'
      AND ph.paid_at <= v_snapshot;

    -- expense overdue
    WITH overdue_exp AS (
      SELECT e.id, e.category, e.due_payment_date
      FROM expenses e
      WHERE e.organization_id = p_org_id
        AND e.status = 'Pending'
        AND e.due_payment_date IS NOT NULL
        AND e.due_payment_date < v_snapshot
    )
    SELECT
      COALESCE((
        SELECT SUM(c.amount) FROM charges c
        WHERE c.expense_id IN (SELECT id FROM overdue_exp)
      ), 0)
      + COALESCE((
        SELECT SUM(se.gross_salary + se.epf_employer + se.socso_employer)
        FROM staff_expenses se
        WHERE se.id IN (SELECT id FROM overdue_exp WHERE category = 'Staff_Related')
      ), 0)
      - COALESCE((
        SELECT SUM(ph.amount) FROM payment_history ph
        WHERE ph.expense_id IN (SELECT id FROM overdue_exp)
          AND ph.status = 'Success'
      ), 0),
      (SELECT COUNT(*) FROM overdue_exp),
      COALESCE((
        SELECT SUM(c.amount) FROM charges c
        WHERE c.expense_id IN (SELECT id FROM overdue_exp WHERE due_payment_date >= v_month_start)
      ), 0)
      + COALESCE((
        SELECT SUM(se.gross_salary + se.epf_employer + se.socso_employer)
        FROM staff_expenses se
        WHERE se.id IN (SELECT id FROM overdue_exp WHERE category = 'Staff_Related' AND due_payment_date >= v_month_start)
      ), 0)
      - COALESCE((
        SELECT SUM(ph.amount) FROM payment_history ph
        WHERE ph.expense_id IN (SELECT id FROM overdue_exp WHERE due_payment_date >= v_month_start)
          AND ph.status = 'Success'
      ), 0)
    INTO v_eo_amount, v_eo_count, v_eo_this_month;

    v_eo_prev := v_eo_amount - v_eo_this_month;

    INSERT INTO financial_daily_summary (
      date, organization_id,
      total_income, total_outcome,
      rental_due, rental_received, owner_paid,
      rental_overdue_amount, rental_overdue_count,
      rental_overdue_this_month, rental_overdue_previous_months,
      expense_total, expense_paid,
      expense_overdue_amount, expense_overdue_count,
      expense_overdue_this_month, expense_overdue_previous_months
    ) VALUES (
      v_loop_month, p_org_id,
      v_total_income, v_total_outcome,
      v_rental_due, v_rental_received, v_owner_paid,
      v_ro_amount, v_ro_count, v_ro_this_month, v_ro_prev,
      v_exp_total, v_exp_paid,
      v_eo_amount, v_eo_count, v_eo_this_month, v_eo_prev
    );

    v_loop_month := (v_loop_month + INTERVAL '1 month')::date;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."populate_monthly_summary"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_duplicate_tenant_subtype"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."prevent_duplicate_tenant_subtype"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_edit_on_resolved_task"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_current_state task_state;
BEGIN
    SELECT state INTO v_current_state
    FROM task_statuses
    WHERE task_id = NEW.task_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_current_state = 'Resolved' THEN
        RAISE EXCEPTION 'Cannot edit a resolved task';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_edit_on_resolved_task"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_flow_task_type_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_current_type task_type;
BEGIN
    -- Get current (latest) type
    SELECT type INTO v_current_type
    FROM task_types
    WHERE task_id = NEW.task_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no previous type, allow (first insert)
    IF v_current_type IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Block if current type is a flow type
    IF v_current_type IN ('Inspection', 'Preparation', 'Refund Request', 'Refund Finalization') THEN
        RAISE EXCEPTION 'Cannot change type of flow task (current type: %)', v_current_type;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_flow_task_type_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_report_on_invalid_state"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_task_type task_type;
    v_current_state task_state;
    v_flow task_flow_instances%ROWTYPE;
BEGIN
    -- Get current state
    SELECT state INTO v_current_state
    FROM task_statuses
    WHERE task_id = NEW.task_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get task type
    SELECT type INTO v_task_type
    FROM task_types
    WHERE task_id = NEW.task_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Refund Request
    IF v_task_type = 'Refund Request' THEN
        IF v_current_state NOT IN ('In Progress', 'Needs Modification') THEN
            RAISE EXCEPTION 'Refund Request can only submit report when In Progress or Needs Modification';
        END IF;
        RETURN NEW;
    END IF;
    
    -- Refund Finalization
    IF v_task_type = 'Refund Finalization' THEN
        IF v_current_state NOT IN ('In Progress', 'Resolved') THEN
            RAISE EXCEPTION 'Refund Finalization can only submit report when In Progress or Resolved';
        END IF;
        RETURN NEW;
    END IF;
    
    -- Normal tasks: block if Resolved
    IF v_current_state = 'Resolved' THEN
        RAISE EXCEPTION 'Cannot submit report on a resolved task';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_report_on_invalid_state"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_status_after_flow_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_task_type task_type;
    v_current_state task_state;
    v_flow task_flow_instances%ROWTYPE;
BEGIN
    -- Get current state
    SELECT state INTO v_current_state
    FROM task_statuses
    WHERE task_id = NEW.task_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get task type
    SELECT type INTO v_task_type
    FROM task_types
    WHERE task_id = NEW.task_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Refund Request or Refund Finalization
    IF v_task_type IN ('Refund Request', 'Refund Finalization') THEN
        -- Get flow instance
        SELECT * INTO v_flow
        FROM task_flow_instances
        WHERE refund_request_task_id = NEW.task_id
           OR refund_finalization_task_id = NEW.task_id;
        
        IF FOUND THEN
            -- Block if Finalization has is_resolved = true
            IF EXISTS (
                SELECT 1 FROM task_reports
                WHERE task_id = v_flow.refund_finalization_task_id
                AND is_resolved = true
            ) THEN
                RAISE EXCEPTION 'Cannot change status - lease ending flow is completed';
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Normal tasks: block if already Resolved
    IF v_current_state = 'Resolved' THEN
        RAISE EXCEPTION 'Cannot change status of a resolved task';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_status_after_flow_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_terminal_assignment_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Prevent updates if assignment was cancelled or unassigned
    IF OLD.status IN ('Cancelled', 'Unassigned', 'Rejected') THEN
        RAISE EXCEPTION 'Cannot update a terminated assignment (status: %)', OLD.status;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_terminal_assignment_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_terminal_state_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF OLD.status IN ('Rejected', 'Unassigned', 'Cancelled') THEN
    RAISE EXCEPTION 'Cannot update assignment in terminal state: %', OLD.status;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_terminal_state_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_all_orgs_financial_warehouse"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_org RECORD;
  v_start_time TIMESTAMPTZ;
  v_org_count INT := 0;
  v_error_msg TEXT;
BEGIN
  v_start_time := clock_timestamp();

  BEGIN
    FOR v_org IN SELECT id FROM organizations LOOP
      PERFORM run_financial_warehouse(v_org.id);
      v_org_count := v_org_count + 1;
    END LOOP;

    INSERT INTO cron_logs (
      job_name, status, records_processed,
      charges_applied, execution_time_ms
    ) VALUES (
      'daily-financial-warehouse',
      'Success',
      v_org_count,
      0,
      EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::int
    );

  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;

    INSERT INTO cron_logs (
      job_name, status, records_processed,
      charges_applied, error_message, execution_time_ms
    ) VALUES (
      'daily-financial-warehouse',
      'Failed',
      v_org_count,
      0,
      v_error_msg,
      EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::int
    );

    RAISE;
  END;
END;
$$;


ALTER FUNCTION "public"."run_all_orgs_financial_warehouse"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_financial_warehouse"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM populate_daily_occupancy(p_org_id);
  PERFORM populate_monthly_summary(p_org_id);
  PERFORM populate_monthly_property(p_org_id);
  PERFORM populate_monthly_expense_category(p_org_id);
  PERFORM populate_monthly_payment_type(p_org_id);
  PERFORM populate_monthly_property_expense(p_org_id);
END;
$$;


ALTER FUNCTION "public"."run_financial_warehouse"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_billplz_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if status is 'Success' and billplz_bill_id exists but billplz_transaction_id is null
  IF NEW.status = 'Success' AND NEW.billplz_bill_id IS NOT NULL AND NEW.billplz_transaction_id IS NULL THEN
    RAISE EXCEPTION 'Payment history with status Success and billplz_bill_id must have a billplz_transaction_id for legitimacy verification';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_billplz_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_lease_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  conflict_lease RECORD;
BEGIN
  -- If inserting with status 'Ended', ensure end date is in the past
  IF NEW.status = 'Ended' THEN
    IF NEW.number_of_months IS NULL THEN
      RAISE EXCEPTION 'LEASE_ERROR:ENDED_NO_END_DATE';
    END IF;
    
    IF NEW.start_date + (NEW.number_of_months * INTERVAL '1 month') > NOW() THEN
      RAISE EXCEPTION 'LEASE_ERROR:ENDED_FUTURE_DATE';
    END IF;
  END IF;

  -- Only check conflicts for 'Current' status leases
  IF NEW.status != 'Current' THEN
    RETURN NEW;
  END IF;

  -- Skip check if updating a Current lease without changing property/room
  IF TG_OP = 'UPDATE' 
     AND OLD.status = 'Current' 
     AND NEW.status = 'Current'
     AND OLD.property_id = NEW.property_id 
     AND OLD.room_id IS NOT DISTINCT FROM NEW.room_id THEN
    RETURN NEW;
  END IF;

  -- Case 1: Room lease being created
  IF NEW.room_id IS NOT NULL THEN
    -- Check if property has an active property-level lease
    SELECT reference_id INTO conflict_lease
    FROM leases
    WHERE property_id = NEW.property_id
      AND room_id IS NULL
      AND status = 'Current'
      AND (NEW.id IS NULL OR id != NEW.id)
    LIMIT 1;
    
    IF FOUND THEN
      RAISE EXCEPTION 'LEASE_CONFLICT:PROPERTY_HAS_LEASE:%', conflict_lease.reference_id;
    END IF;

    -- Check if room already has an active lease
    SELECT reference_id INTO conflict_lease
    FROM leases
    WHERE room_id = NEW.room_id
      AND status = 'Current'
      AND (NEW.id IS NULL OR id != NEW.id)
    LIMIT 1;
    
    IF FOUND THEN
      RAISE EXCEPTION 'LEASE_CONFLICT:ROOM_HAS_LEASE:%', conflict_lease.reference_id;
    END IF;

  -- Case 2: Property lease being created (no room_id)
  ELSE
    -- Check if property already has an active property-level lease
    SELECT reference_id INTO conflict_lease
    FROM leases
    WHERE property_id = NEW.property_id
      AND room_id IS NULL
      AND status = 'Current'
      AND (NEW.id IS NULL OR id != NEW.id)
    LIMIT 1;
    
    IF FOUND THEN
      RAISE EXCEPTION 'LEASE_CONFLICT:PROPERTY_HAS_LEASE:%', conflict_lease.reference_id;
    END IF;

    -- Check if any room under this property has an active lease
    SELECT reference_id INTO conflict_lease
    FROM leases
    WHERE property_id = NEW.property_id
      AND room_id IS NOT NULL
      AND status = 'Current'
      AND (NEW.id IS NULL OR id != NEW.id)
    LIMIT 1;
    
    IF FOUND THEN
      RAISE EXCEPTION 'LEASE_CONFLICT:ROOM_HAS_ACTIVE_LEASE:%', conflict_lease.reference_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_lease_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_lease_property_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  property_status_val property_status_new;
  room_status_val property_status_new;
  blocking_room RECORD;
BEGIN
  -- Always check property status
  SELECT status INTO property_status_val
  FROM properties
  WHERE id = NEW.property_id;

  IF property_status_val IN ('Pending Inspection', 'Under Preparation') THEN
    RAISE EXCEPTION 'Cannot create lease: property status is %', property_status_val;
  END IF;

  -- Property-level lease: check ALL rooms under this property
  IF NEW.room_id IS NULL THEN
    SELECT id, title, status INTO blocking_room
    FROM rooms
    WHERE property_id = NEW.property_id
      AND status IN ('Pending Inspection', 'Under Preparation')
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION 'Cannot create lease for property: room "%" has status %', 
        blocking_room.title, blocking_room.status;
    END IF;

  -- Room-level lease: check only that specific room
  ELSE
    SELECT status INTO room_status_val
    FROM rooms
    WHERE id = NEW.room_id;

    IF room_status_val IN ('Pending Inspection', 'Under Preparation') THEN
      RAISE EXCEPTION 'Cannot create lease: room status is %', room_status_val;
    END IF;
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."validate_lease_property_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_lease_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Check if any column other than status is being changed
  IF NEW.start_date IS DISTINCT FROM OLD.start_date
    OR NEW.number_of_months IS DISTINCT FROM OLD.number_of_months
    OR NEW.payment_day IS DISTINCT FROM OLD.payment_day
    OR NEW.is_expiry_reminder IS DISTINCT FROM OLD.is_expiry_reminder
    OR NEW.expiry_days_before_reminder IS DISTINCT FROM OLD.expiry_days_before_reminder
    OR NEW.is_rent_reminder IS DISTINCT FROM OLD.is_rent_reminder
    OR NEW.rent_reminder_days_before IS DISTINCT FROM OLD.rent_reminder_days_before
    OR NEW.is_overdue_rent_reminder IS DISTINCT FROM OLD.is_overdue_rent_reminder
    OR NEW.overdue_days_after_reminder IS DISTINCT FROM OLD.overdue_days_after_reminder
    OR NEW.property_id IS DISTINCT FROM OLD.property_id
    OR NEW.room_id IS DISTINCT FROM OLD.room_id
    OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
    OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.reference_id IS DISTINCT FROM OLD.reference_id
  THEN
    RAISE EXCEPTION 'Only status column can be updated on leases';
  END IF;

  -- Prevent changing from Ended back to Current
  IF OLD.status = 'Ended' AND NEW.status = 'Current' THEN
    RAISE EXCEPTION 'Cannot change lease status from Ended back to Current';
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."validate_lease_update"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" character varying(50) NOT NULL,
    "last_name" character varying(30),
    "phone_number" "text" NOT NULL,
    "email" "text",
    "organization_id" "uuid",
    CONSTRAINT "email_valid_check" CHECK ((("char_length"("email") >= 5) AND ("char_length"("email") <= 255) AND ("email" ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))),
    CONSTRAINT "first_name_length_check" CHECK ((("char_length"(("first_name")::"text") >= 1) AND ("char_length"(("first_name")::"text") <= 50))),
    CONSTRAINT "last_name_check" CHECK ((("char_length"(("last_name")::"text") >= 1) AND ("char_length"(("last_name")::"text") <= 50))),
    CONSTRAINT "phone_number_valid_check" CHECK ((("char_length"("phone_number") >= 8) AND ("char_length"("phone_number") <= 20) AND ("phone_number" ~ '^\+[0-9]+$'::"text")))
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "room_id" "uuid",
    "move_in_timestamp" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "reference_id" "text" NOT NULL,
    "status" "public"."booking_status" DEFAULT 'Current'::"public"."booking_status" NOT NULL,
    CONSTRAINT "bookings_booking_id_check" CHECK (("reference_id" ~ '^BK-[0-9]{4}-[0-9]{4}$'::"text"))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."charges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "is_taxed" boolean DEFAULT false NOT NULL,
    "is_refunded" boolean DEFAULT false NOT NULL,
    "payment_id" "uuid",
    "expense_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "charges_amount_check" CHECK ((("amount")::double precision >= (0)::double precision)),
    CONSTRAINT "charges_amount_non_negative" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "charges_check" CHECK (((("payment_id" IS NOT NULL) AND ("expense_id" IS NULL)) OR (("payment_id" IS NULL) AND ("expense_id" IS NOT NULL)))),
    CONSTRAINT "charges_title_check" CHECK ((("char_length"("title") >= 2) AND ("char_length"("title") <= 200))),
    CONSTRAINT "only_one_reference" CHECK ((((("payment_id" IS NOT NULL))::integer + (("expense_id" IS NOT NULL))::integer) = 1))
);


ALTER TABLE "public"."charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_expenses" (
    "id" "uuid" NOT NULL,
    "type" "public"."company_expense_type" NOT NULL,
    "is_claimed" boolean DEFAULT false NOT NULL,
    "claimer_id" "uuid",
    "is_asset" boolean DEFAULT false NOT NULL,
    "vendor_id" "uuid"
);


ALTER TABLE "public"."company_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_tenants" (
    "tenant_id" "uuid" NOT NULL,
    "registration_no" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "contact_person_first_name" "text" NOT NULL,
    "contact_person_last_name" "text",
    "phone_number" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "company_tenants_company_name_check" CHECK ((("char_length"("company_name") >= 2) AND ("char_length"("company_name") <= 200))),
    CONSTRAINT "company_tenants_contact_person_first_name_check" CHECK ((("char_length"("contact_person_first_name") >= 1) AND ("char_length"("contact_person_first_name") <= 100))),
    CONSTRAINT "company_tenants_contact_person_last_name_check" CHECK ((("char_length"("contact_person_last_name") >= 1) AND ("char_length"("contact_person_last_name") <= 100))),
    CONSTRAINT "company_tenants_phone_number_check" CHECK ((("char_length"("phone_number") >= 8) AND ("char_length"("phone_number") <= 20) AND ("phone_number" ~ '^\+[0-9]+$'::"text"))),
    CONSTRAINT "company_tenants_registration_no_check" CHECK ((("char_length"("registration_no") >= 5) AND ("char_length"("registration_no") <= 50)))
);


ALTER TABLE "public"."company_tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_expenses" (
    "id" "uuid" NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "type" "public"."contract_expense_type" NOT NULL,
    "is_first_rental" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."contract_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "number_of_months" integer,
    "is_expiry_reminder" boolean DEFAULT false NOT NULL,
    "expiry_days_before_reminder" integer,
    "is_rent_reminder" boolean DEFAULT false NOT NULL,
    "rent_reminder_days_before" integer,
    "is_overdue_rent_reminder" boolean DEFAULT false NOT NULL,
    "overdue_days_after_reminder" integer,
    "property_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "payment_day" integer DEFAULT 1 NOT NULL,
    "monthly_rent" numeric(10,2) DEFAULT 0 NOT NULL,
    "reference_id" "text" DEFAULT 'CT-0000-0000'::"text" NOT NULL,
    "ended_at" timestamp with time zone,
    "status" "public"."lease_status_new" NOT NULL,
    "rental_period" "public"."contract_rental_period" DEFAULT 'Monthly'::"public"."contract_rental_period" NOT NULL,
    "frequency" integer DEFAULT 1 NOT NULL,
    "lead_days" integer DEFAULT 7 NOT NULL,
    "billing_cycle_start_month" "date" NOT NULL,
    CONSTRAINT "contracts_check" CHECK (((("is_expiry_reminder" = true) AND ("expiry_days_before_reminder" IS NOT NULL) AND ("expiry_days_before_reminder" >= 0)) OR ("is_expiry_reminder" = false))),
    CONSTRAINT "contracts_check1" CHECK (((("is_rent_reminder" = true) AND ("rent_reminder_days_before" IS NOT NULL) AND ("rent_reminder_days_before" >= 0)) OR ("is_rent_reminder" = false))),
    CONSTRAINT "contracts_check2" CHECK (((("is_overdue_rent_reminder" = true) AND ("overdue_days_after_reminder" IS NOT NULL) AND ("overdue_days_after_reminder" >= 0)) OR ("is_overdue_rent_reminder" = false))),
    CONSTRAINT "contracts_frequency_check" CHECK (("frequency" > 0)),
    CONSTRAINT "contracts_lead_days_check" CHECK (("lead_days" >= 0)),
    CONSTRAINT "contracts_monthly_rent_check" CHECK (("monthly_rent" >= (0)::numeric)),
    CONSTRAINT "contracts_number_of_months_check" CHECK (("number_of_months" >= 1)),
    CONSTRAINT "contracts_payment_day_check" CHECK ((("payment_day" >= 1) AND ("payment_day" <= 28))),
    CONSTRAINT "contracts_reference_id_check" CHECK (("reference_id" ~ '^CT-[0-9]{4}-[0-9]{4}$'::"text"))
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "job_name" "text" NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "records_processed" integer DEFAULT 0 NOT NULL,
    "charges_applied" integer DEFAULT 0 NOT NULL,
    "error_message" "text",
    "execution_time_ms" integer
);


ALTER TABLE "public"."cron_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deduction_charges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "expense_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "deduction_charges_amount_non_negative" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "deduction_charges_title_check" CHECK ((("char_length"("title") >= 2) AND ("char_length"("title") <= 200)))
);


ALTER TABLE "public"."deduction_charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "due_payment_date" timestamp with time zone,
    "category" "public"."expense_category" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "status" "public"."payment_status" NOT NULL,
    "reference_id" "text" DEFAULT 'XP-202500000001'::"text",
    "recurring_config_id" "uuid",
    "description" "text",
    "expense_evidence" "text",
    CONSTRAINT "expenses_reference_id_check" CHECK (("reference_id" ~ '^XP-[0-9]{12}$'::"text"))
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_daily_expense_category" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."financial_daily_expense_category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_daily_occupancy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "properties_count" integer NOT NULL,
    "rooms_count" integer NOT NULL,
    "properties_leased_count" integer NOT NULL,
    "rooms_leased_count" integer NOT NULL,
    "occupancy_rate" numeric(5,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."financial_daily_occupancy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_daily_payment_type" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "type" "text" NOT NULL,
    "amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."financial_daily_payment_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_daily_property" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "income" numeric(12,2) DEFAULT 0 NOT NULL,
    "outcome" numeric(12,2) DEFAULT 0 NOT NULL,
    "rental_received" numeric(12,2) DEFAULT 0 NOT NULL,
    "owner_paid" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."financial_daily_property" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_daily_property_expense" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."financial_daily_property_expense" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_daily_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "total_income" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_outcome" numeric(12,2) DEFAULT 0 NOT NULL,
    "rental_due" numeric(12,2) DEFAULT 0 NOT NULL,
    "rental_received" numeric(12,2) DEFAULT 0 NOT NULL,
    "owner_paid" numeric(12,2) DEFAULT 0 NOT NULL,
    "rental_overdue_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "rental_overdue_count" integer DEFAULT 0 NOT NULL,
    "rental_overdue_this_month" numeric(12,2) DEFAULT 0 NOT NULL,
    "rental_overdue_previous_months" numeric(12,2) DEFAULT 0 NOT NULL,
    "expense_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "expense_paid" numeric(12,2) DEFAULT 0 NOT NULL,
    "expense_overdue_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "expense_overdue_count" integer DEFAULT 0 NOT NULL,
    "expense_overdue_this_month" numeric(12,2) DEFAULT 0 NOT NULL,
    "expense_overdue_previous_months" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."financial_daily_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."individual_tenants" (
    "tenant_id" "uuid" NOT NULL,
    "identity_type" "public"."identity_type" NOT NULL,
    "identity_number" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "phone_number" "text" NOT NULL,
    CONSTRAINT "individual_tenants_check" CHECK (((("identity_type" = 'mykad'::"public"."identity_type") AND ("char_length"("identity_number") = 12) AND ("identity_number" ~ '^[0-9]{12}$'::"text")) OR (("identity_type" = 'passport'::"public"."identity_type") AND ("char_length"("identity_number") >= 6) AND ("char_length"("identity_number") <= 20)))),
    CONSTRAINT "individual_tenants_first_name_check" CHECK ((("char_length"("first_name") >= 1) AND ("char_length"("first_name") <= 100))),
    CONSTRAINT "individual_tenants_last_name_check" CHECK ((("char_length"("last_name") >= 1) AND ("char_length"("last_name") <= 100))),
    CONSTRAINT "individual_tenants_phone_number_check" CHECK ((("char_length"("phone_number") >= 8) AND ("char_length"("phone_number") <= 20) AND ("phone_number" ~ '^\+[0-9]+$'::"text")))
);


ALTER TABLE "public"."individual_tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."late_payment_charges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid",
    "days_after_due" integer NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "room_id" "uuid",
    "lease_id" "uuid",
    CONSTRAINT "late_payment_charges_amount_check" CHECK ((("amount")::double precision >= (0)::double precision)),
    CONSTRAINT "late_payment_charges_amount_non_negative" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "late_payment_charges_days_after_due_check" CHECK ((("days_after_due" >= 1) AND ("days_after_due" <= 28))),
    CONSTRAINT "one_of_property_lease_room" CHECK (((((("property_id" IS NOT NULL))::integer + (("lease_id" IS NOT NULL))::integer) + (("room_id" IS NOT NULL))::integer) = 1))
);


ALTER TABLE "public"."late_payment_charges" OWNER TO "postgres";


COMMENT ON TABLE "public"."late_payment_charges" IS 'Late payment penalty charges based on days overdue';



COMMENT ON COLUMN "public"."late_payment_charges"."days_after_due" IS 'Number of days after payment due date';



COMMENT ON COLUMN "public"."late_payment_charges"."amount" IS 'Late payment charge amount';



CREATE TABLE IF NOT EXISTS "public"."lease_end_schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scheduled_date" timestamp with time zone NOT NULL,
    "status" "public"."lease_end_schedule_status_type" DEFAULT 'Current'::"public"."lease_end_schedule_status_type" NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cancelled_by" "uuid",
    "cancelled_at" timestamp with time zone
);


ALTER TABLE "public"."lease_end_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "number_of_months" integer,
    "payment_day" integer NOT NULL,
    "monthly_rent" numeric(10,2) NOT NULL,
    "is_expiry_reminder" boolean DEFAULT false NOT NULL,
    "expiry_days_before_reminder" integer,
    "is_rent_reminder" boolean DEFAULT false NOT NULL,
    "rent_reminder_days_before" integer,
    "is_overdue_rent_reminder" boolean DEFAULT false NOT NULL,
    "overdue_days_after_reminder" integer,
    "property_id" "uuid" NOT NULL,
    "room_id" "uuid",
    "tenant_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "status" "public"."lease_status_new" NOT NULL,
    "reference_id" "text" NOT NULL,
    "ended_at" timestamp with time zone,
    "transferred_from" "uuid",
    "is_transferred_from" boolean DEFAULT false NOT NULL,
    "transferred_to" "uuid",
    "is_transferred_to" boolean DEFAULT false NOT NULL,
    "booking_id" "uuid",
    "agent_id" "uuid",
    CONSTRAINT "leases_check" CHECK (((("is_expiry_reminder" = true) AND ("expiry_days_before_reminder" IS NOT NULL) AND ("expiry_days_before_reminder" >= 0)) OR ("is_expiry_reminder" = false))),
    CONSTRAINT "leases_check1" CHECK (((("is_rent_reminder" = true) AND ("rent_reminder_days_before" IS NOT NULL) AND ("rent_reminder_days_before" >= 0)) OR ("is_rent_reminder" = false))),
    CONSTRAINT "leases_check2" CHECK (((("is_overdue_rent_reminder" = true) AND ("overdue_days_after_reminder" IS NOT NULL) AND ("overdue_days_after_reminder" >= 0)) OR ("is_overdue_rent_reminder" = false))),
    CONSTRAINT "leases_lease_id_check" CHECK (("reference_id" ~ '^LS-[0-9]{4}-[0-9]{4}$'::"text")),
    CONSTRAINT "leases_monthly_rent_check" CHECK ((("monthly_rent")::double precision >= (0)::double precision)),
    CONSTRAINT "leases_number_of_months_check" CHECK (("number_of_months" >= 1)),
    CONSTRAINT "leases_payment_day_check" CHECK ((("payment_day" >= 1) AND ("payment_day" <= 28))),
    CONSTRAINT "monthly_rent_non_negative" CHECK (("monthly_rent" >= (0)::numeric))
);


ALTER TABLE "public"."leases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "reference_id" "uuid",
    "reference_type" "text",
    "performer_id" "uuid",
    "performer_type" "public"."performer_type",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "page" "text",
    "affected_type" "public"."affected_type",
    "affected_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."notifications"."page" IS 'page to be redirected to';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "public"."organization_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "organizations_title_check" CHECK ((("char_length"("title") >= 2) AND ("char_length"("title") <= 200)))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations_tenants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."organizations_tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "email" "text",
    "phone_number" "text" NOT NULL,
    "profile_pic" "text",
    "profile_thumb" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "owners_email_check" CHECK ((("char_length"("email") >= 5) AND ("char_length"("email") <= 255) AND ("email" ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))),
    CONSTRAINT "owners_first_name_check" CHECK ((("char_length"("first_name") >= 1) AND ("char_length"("first_name") <= 100))),
    CONSTRAINT "owners_last_name_check" CHECK ((("char_length"("last_name") >= 1) AND ("char_length"("last_name") <= 100))),
    CONSTRAINT "owners_phone_number_check" CHECK ((("char_length"("phone_number") >= 8) AND ("char_length"("phone_number") <= 20) AND ("phone_number" ~ '^\+[0-9]+$'::"text"))),
    CONSTRAINT "owners_profile_pic_check" CHECK (("char_length"("profile_pic") <= 1000)),
    CONSTRAINT "owners_profile_thumb_check" CHECK (("char_length"("profile_thumb") <= 1000))
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_method" "public"."payment_method" NOT NULL,
    "paid_at" timestamp with time zone NOT NULL,
    "registrar_role" "public"."registrar_role" NOT NULL,
    "registrar" "uuid",
    "expense_id" "uuid",
    "payment_id" "uuid",
    "receipt_image" "text",
    "billplz_bill_id" "text",
    "billplz_transaction_id" "text",
    "status" "public"."payment_record_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "group_payment" boolean DEFAULT false,
    "is_checked" boolean DEFAULT false,
    CONSTRAINT "charges_amount_non_negative" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "payment_history_amount_check" CHECK ((("amount")::double precision >= (0)::double precision)),
    CONSTRAINT "payment_history_check" CHECK (((("registrar_role" = 'staff'::"public"."registrar_role") AND ("registrar" IS NOT NULL)) OR (("registrar_role" = 'tenant'::"public"."registrar_role") AND ("registrar" IS NULL)))),
    CONSTRAINT "payment_history_check1" CHECK (((("payment_id" IS NOT NULL) AND ("expense_id" IS NULL)) OR (("payment_id" IS NULL) AND ("expense_id" IS NOT NULL)))),
    CONSTRAINT "payment_history_receipt_image_check" CHECK (("char_length"("receipt_image") <= 1000))
);


ALTER TABLE "public"."payment_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_late_charges_applied" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "rental_payment_id" "uuid" NOT NULL,
    "late_charge_config_id" "uuid" NOT NULL,
    "late_charge_payment_id" "uuid" NOT NULL,
    "applied_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "days_overdue_when_applied" integer NOT NULL,
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "payment_late_charges_applied_days_overdue_when_applied_check" CHECK (("days_overdue_when_applied" >= 0))
);


ALTER TABLE "public"."payment_late_charges_applied" OWNER TO "postgres";


COMMENT ON TABLE "public"."payment_late_charges_applied" IS 'Junction table tracking which late payment charges have been applied to rental payments. Prevents duplicate charge application through unique constraint.';



COMMENT ON COLUMN "public"."payment_late_charges_applied"."rental_payment_id" IS 'The original rental payment that became overdue';



COMMENT ON COLUMN "public"."payment_late_charges_applied"."late_charge_config_id" IS 'The late_payment_charges configuration record that was triggered';



COMMENT ON COLUMN "public"."payment_late_charges_applied"."late_charge_payment_id" IS 'The new payment record created for the late charge';



COMMENT ON COLUMN "public"."payment_late_charges_applied"."days_overdue_when_applied" IS 'Snapshot of how many days overdue the payment was when this charge was applied (for audit purposes)';



CREATE SEQUENCE IF NOT EXISTS "public"."payment_reference_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."payment_reference_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "due_payment_timestamp" timestamp with time zone,
    "lease_id" "uuid",
    "booking_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "status" "public"."payment_status" NOT NULL,
    "type" "public"."payment_type" NOT NULL,
    "reference_id" "text" DEFAULT 'PY-202500000001'::"text" NOT NULL,
    "recurring_config_id" "uuid",
    "payment_evidence" "text",
    CONSTRAINT "payments_check" CHECK (((("lease_id" IS NOT NULL) AND ("booking_id" IS NULL)) OR (("lease_id" IS NULL) AND ("booking_id" IS NOT NULL)))),
    CONSTRAINT "payments_reference_id_check" CHECK (("reference_id" ~ '^PY-[0-9]{12}$'::"text"))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "module" "text" NOT NULL,
    "action" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    CONSTRAINT "permissions_action_check" CHECK ((("char_length"("action") >= 1) AND ("char_length"("action") <= 100))),
    CONSTRAINT "permissions_description_check" CHECK ((("char_length"("description") >= 1) AND ("char_length"("description") <= 500))),
    CONSTRAINT "permissions_module_check" CHECK ((("char_length"("module") >= 1) AND ("char_length"("module") <= 100))),
    CONSTRAINT "permissions_title_check" CHECK ((("char_length"("title") >= 2) AND ("char_length"("title") <= 200)))
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "state" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "projects_state_check" CHECK ((("char_length"("state") >= 2) AND ("char_length"("state") <= 100))),
    CONSTRAINT "projects_title_check" CHECK ((("char_length"("title") >= 2) AND ("char_length"("title") <= 200)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" "text" NOT NULL,
    "street_address" "text" NOT NULL,
    "postal_code" "text" NOT NULL,
    "type" "public"."property_type" NOT NULL,
    "project_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "status" "public"."property_status_new" DEFAULT 'Ready'::"public"."property_status_new" NOT NULL,
    "city" "text" NOT NULL,
    "wifi" boolean DEFAULT false,
    "cleaning_service" boolean DEFAULT false,
    "female" boolean DEFAULT false,
    "water_heater" boolean DEFAULT false,
    "owner_id" "uuid",
    "dryer" boolean DEFAULT false NOT NULL,
    CONSTRAINT "properties_code_check" CHECK ((("char_length"("code") >= 1) AND ("char_length"("code") <= 50))),
    CONSTRAINT "properties_postal_code_check" CHECK ((("char_length"("postal_code") >= 4) AND ("char_length"("postal_code") <= 10))),
    CONSTRAINT "properties_street_address_check" CHECK ((("char_length"("street_address") >= 5) AND ("char_length"("street_address") <= 300)))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_default_initial_charges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid",
    "charge_type" "public"."initial_charge_type" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "is_taxed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "room_id" "uuid",
    "is_refundable" boolean DEFAULT false NOT NULL,
    CONSTRAINT "initial_charges_amount_non_negative" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "property_default_initial_charges_amount_check" CHECK ((("amount")::double precision >= (0)::double precision)),
    CONSTRAINT "property_or_room_check" CHECK (((("property_id" IS NOT NULL) AND ("room_id" IS NULL)) OR (("property_id" IS NULL) AND ("room_id" IS NOT NULL))))
);


ALTER TABLE "public"."property_default_initial_charges" OWNER TO "postgres";


COMMENT ON TABLE "public"."property_default_initial_charges" IS 'Default initial charges when creating a new lease for this property';



CREATE TABLE IF NOT EXISTS "public"."property_default_lease_config" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid",
    "default_monthly_rent" numeric(10,2),
    "default_payment_day" integer,
    "is_expiry_reminder" boolean DEFAULT false NOT NULL,
    "expiry_days_before_reminder" integer,
    "is_rent_reminder" boolean DEFAULT false NOT NULL,
    "rent_reminder_days_before" integer,
    "is_overdue_rent_reminder" boolean DEFAULT false NOT NULL,
    "overdue_days_after_reminder" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "room_id" "uuid",
    CONSTRAINT "default_monthly_rent_non_negative" CHECK (("default_monthly_rent" >= (0)::numeric)),
    CONSTRAINT "lease_config_property_or_room_check" CHECK (((("property_id" IS NOT NULL) AND ("room_id" IS NULL)) OR (("property_id" IS NULL) AND ("room_id" IS NOT NULL)))),
    CONSTRAINT "property_default_lease_config_check" CHECK (((("is_expiry_reminder" = true) AND ("expiry_days_before_reminder" IS NOT NULL) AND ("expiry_days_before_reminder" >= 0)) OR ("is_expiry_reminder" = false))),
    CONSTRAINT "property_default_lease_config_check1" CHECK (((("is_rent_reminder" = true) AND ("rent_reminder_days_before" IS NOT NULL) AND ("rent_reminder_days_before" >= 0)) OR ("is_rent_reminder" = false))),
    CONSTRAINT "property_default_lease_config_check2" CHECK (((("is_overdue_rent_reminder" = true) AND ("overdue_days_after_reminder" IS NOT NULL) AND ("overdue_days_after_reminder" >= 0)) OR ("is_overdue_rent_reminder" = false))),
    CONSTRAINT "property_default_lease_config_default_monthly_rent_check" CHECK ((("default_monthly_rent")::double precision >= (0)::double precision)),
    CONSTRAINT "property_default_lease_config_default_payment_day_check" CHECK ((("default_payment_day" >= 1) AND ("default_payment_day" <= 28)))
);


ALTER TABLE "public"."property_default_lease_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."property_default_lease_config" IS 'Default lease configuration for a property - used to pre-fill new lease forms';



COMMENT ON COLUMN "public"."property_default_lease_config"."default_monthly_rent" IS 'Default monthly rent amount for new leases';



COMMENT ON COLUMN "public"."property_default_lease_config"."default_payment_day" IS 'Default payment day (1-28 of each month)';



CREATE TABLE IF NOT EXISTS "public"."property_expenses" (
    "id" "uuid" NOT NULL,
    "property_id" "uuid",
    "type" "public"."property_expense_type" NOT NULL,
    "lease_id" "uuid",
    "is_claimed" boolean DEFAULT false NOT NULL,
    "claimer_id" "uuid",
    "vendor_id" "uuid",
    "expense_month" "date" NOT NULL,
    CONSTRAINT "property_or_lease_xor" CHECK (((("property_id" IS NOT NULL) AND ("lease_id" IS NULL)) OR (("property_id" IS NULL) AND ("lease_id" IS NOT NULL))))
);


ALTER TABLE "public"."property_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_url" "text" NOT NULL,
    "property_id" "uuid",
    "room_id" "uuid",
    "organization_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "thumb_url" "text" NOT NULL,
    CONSTRAINT "property_images_property_xor_room" CHECK (((("property_id" IS NOT NULL) AND ("room_id" IS NULL)) OR (("property_id" IS NULL) AND ("room_id" IS NOT NULL))))
);


ALTER TABLE "public"."property_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_expenses" (
    "id" "uuid" NOT NULL,
    "type" "public"."purchase_expense_type" NOT NULL,
    "is_asset" boolean DEFAULT false NOT NULL,
    "depreciation_percentage" numeric(5,2),
    "property_id" "uuid",
    "is_claimed" boolean DEFAULT false NOT NULL,
    "claimer_id" "uuid",
    "vendor_id" "uuid",
    CONSTRAINT "depreciation_for_misc_others" CHECK ((("type" <> 'Miscellaneous/Others'::"public"."purchase_expense_type") OR (("type" = 'Miscellaneous/Others'::"public"."purchase_expense_type") AND ("is_asset" = false) AND ("depreciation_percentage" IS NULL)) OR (("type" = 'Miscellaneous/Others'::"public"."purchase_expense_type") AND ("is_asset" = true) AND ("depreciation_percentage" IS NOT NULL))))
);


ALTER TABLE "public"."purchase_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurring_configs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "every" integer,
    "time_unit" "public"."time_unit" DEFAULT 'Month'::"public"."time_unit",
    "event_on" "text",
    "title" "text" NOT NULL,
    "lease_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    "is_payment_fixed" boolean NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "property_id" "uuid",
    "offset_days" smallint DEFAULT 7 NOT NULL,
    "type" "public"."recurring_config_type" DEFAULT 'Payment'::"public"."recurring_config_type" NOT NULL,
    CONSTRAINT "recurring_configs_every_check" CHECK (("every" >= 1)),
    CONSTRAINT "recurring_configs_title_length" CHECK (("char_length"("title") <= 50)),
    CONSTRAINT "recurring_on_check" CHECK (((("time_unit" = ANY (ARRAY['Day'::"public"."time_unit", 'Year'::"public"."time_unit"])) AND ("event_on" IS NULL)) OR (("time_unit" = ANY (ARRAY['Week'::"public"."time_unit", 'Month'::"public"."time_unit"])) AND ("event_on" IS NOT NULL))))
);


ALTER TABLE "public"."recurring_configs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."recurring_configs"."is_payment_fixed" IS 'This column is to determine if the payment/expense fixed or need, on every bill generated, to determine the value of the generated bill';



COMMENT ON COLUMN "public"."recurring_configs"."property_id" IS 'Used for expenses that are recurring of category property related';



CREATE TABLE IF NOT EXISTS "public"."refund_decisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "flow_instance_id" "uuid" NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "decision" "public"."decision" NOT NULL,
    "original_deposit" numeric NOT NULL,
    "total_charges" numeric NOT NULL,
    "final_refund_amount" numeric NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "submitted_at" timestamp(6) with time zone DEFAULT "now"() NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp(6) with time zone,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."refund_decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refunded_charges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "refund_decision_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamp(6) with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."refunded_charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminder_recipients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reminder_id" "uuid",
    "recipient_type" "public"."reminder_recipient_type" NOT NULL,
    "recipient_id" "uuid",
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reminder_recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "type" "text" NOT NULL,
    "reference_id" "uuid",
    "reference_type" "text",
    "remind_at" timestamp with time zone NOT NULL,
    "sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "roles_title_check" CHECK ((("char_length"("title") >= 2) AND ("char_length"("title") <= 100)))
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles_permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."roles_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "property_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "status" "public"."property_status_new" DEFAULT 'Ready'::"public"."property_status_new" NOT NULL,
    "wifi" boolean DEFAULT false,
    "cleaning_service" boolean DEFAULT false,
    "toilet" boolean DEFAULT false,
    "balcony" boolean DEFAULT false,
    "female" boolean DEFAULT false,
    "ac" boolean DEFAULT false,
    "queen_bed" boolean DEFAULT false,
    CONSTRAINT "rooms_title_check" CHECK ((("char_length"("title") >= 1) AND ("char_length"("title") <= 100)))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_rental_changes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lease_id" "uuid" NOT NULL,
    "new_monthly_rent" numeric(10,2) NOT NULL,
    "old_monthly_rent" numeric(10,2) NOT NULL,
    "effective_from" timestamp with time zone NOT NULL,
    "status" "public"."scheduled_change_status" DEFAULT 'Scheduled'::"public"."scheduled_change_status" NOT NULL,
    "applied_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."scheduled_rental_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" NOT NULL,
    "staff_id" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "role_id" "uuid" NOT NULL,
    "profile_pic" "text",
    "profile_thumb" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "phone_number" "text" NOT NULL,
    CONSTRAINT "staff_first_name_check" CHECK ((("char_length"("first_name") >= 1) AND ("char_length"("first_name") <= 100))),
    CONSTRAINT "staff_last_name_check" CHECK ((("char_length"("last_name") >= 1) AND ("char_length"("last_name") <= 100))),
    CONSTRAINT "staff_phone_number_check" CHECK ((("char_length"("phone_number") >= 8) AND ("char_length"("phone_number") <= 20) AND ("phone_number" ~ '^\+[0-9]+$'::"text"))),
    CONSTRAINT "staff_profile_pic_check" CHECK (("char_length"("profile_pic") <= 1000)),
    CONSTRAINT "staff_profile_thumb_check" CHECK (("char_length"("profile_thumb") <= 1000)),
    CONSTRAINT "staff_staff_id_check" CHECK ((("char_length"("staff_id") = 8) AND ("staff_id" ~ '^STF-[0-9]{4}$'::"text")))
);


ALTER TABLE "public"."staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_expenses" (
    "id" "uuid" NOT NULL,
    "staff_id" "uuid",
    "type" "public"."staff_expense_type" NOT NULL,
    "month" "date" NOT NULL,
    "gross_salary" numeric(10,2) NOT NULL,
    "epf_employer" numeric(10,2) NOT NULL,
    "socso_employer" numeric(10,2) NOT NULL,
    "epf_employee" numeric(10,2) NOT NULL,
    "socso_employee" numeric(10,2) NOT NULL,
    "tax" numeric(10,2) DEFAULT 0
);


ALTER TABLE "public"."staff_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "assigner_id" "uuid",
    "assigned_id" "uuid",
    "status" "public"."task_assignment_status" DEFAULT 'Pending'::"public"."task_assignment_status" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "responded_by" "uuid",
    "rejection_reason" "text",
    "cancel_reason" "text",
    "unassigned_at" timestamp with time zone,
    "unassigned_by" "uuid",
    "unassign_reason" "text",
    CONSTRAINT "cancel_reason_requires_cancelled" CHECK ((("cancel_reason" IS NULL) OR ("status" = 'Cancelled'::"public"."task_assignment_status"))),
    CONSTRAINT "rejection_reason_requires_rejected" CHECK ((("rejection_reason" IS NULL) OR ("status" = 'Rejected'::"public"."task_assignment_status"))),
    CONSTRAINT "task_assignments_cancel_reason_length_check" CHECK ((("char_length"("cancel_reason") >= 5) AND ("char_length"("cancel_reason") <= 200))),
    CONSTRAINT "task_assignments_rejection_reason_length_check" CHECK ((("char_length"("rejection_reason") >= 5) AND ("char_length"("rejection_reason") <= 200))),
    CONSTRAINT "task_assignments_unassign_reason_length_check" CHECK ((("char_length"("unassign_reason") >= 5) AND ("char_length"("unassign_reason") <= 200))),
    CONSTRAINT "unassign_reason_requires_unassigned" CHECK ((("unassign_reason" IS NULL) OR ("status" = 'Unassigned'::"public"."task_assignment_status")))
);


ALTER TABLE "public"."task_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "message" "text",
    "attachment" "text",
    "sender_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "task_comments_attachment_length_check" CHECK (("char_length"("attachment") <= 1000)),
    CONSTRAINT "task_comments_message_length_check" CHECK ((("char_length"("message") >= 1) AND ("char_length"("message") <= 1000)))
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_due_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "due_date" timestamp with time zone,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "task_due_dates_reason_length_check" CHECK ((("char_length"("reason") >= 5) AND ("char_length"("reason") <= 200)))
);


ALTER TABLE "public"."task_due_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_flow_instances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flow_type" "public"."task_flow_type" NOT NULL,
    "lease_id" "uuid",
    "property_id" "uuid",
    "room_id" "uuid",
    "status" "text" DEFAULT 'In Progress'::"text" NOT NULL,
    "inspection_task_id" "uuid",
    "refund_request_task_id" "uuid",
    "refund_finalization_task_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "flow_has_reference" CHECK ((("lease_id" IS NOT NULL) OR ("property_id" IS NOT NULL))),
    CONSTRAINT "room_requires_property" CHECK ((("room_id" IS NULL) OR ("property_id" IS NOT NULL)))
);


ALTER TABLE "public"."task_flow_instances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_priorities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "priority" "public"."task_priority" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."task_priorities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "attachment" "text",
    "submitted_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_resolved" boolean DEFAULT true,
    CONSTRAINT "task_reports_attachment_check" CHECK (("char_length"("attachment") <= 1000)),
    CONSTRAINT "task_reports_content_check" CHECK ((("char_length"("content") >= 10) AND ("char_length"("content") <= 2000)))
);


ALTER TABLE "public"."task_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_statuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "state" "public"."task_state" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."task_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "type" "public"."task_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."task_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "attachment" "text",
    "reference_id" "text" NOT NULL,
    "property_id" "uuid",
    "room_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "organization_id" "uuid" NOT NULL,
    "flow_instance_id" "uuid",
    CONSTRAINT "reference_id_format_check" CHECK (("reference_id" ~ '^TSK-[0-9]{11}$'::"text")),
    CONSTRAINT "tasks_attachment_length_check" CHECK (("char_length"("attachment") <= 1000)),
    CONSTRAINT "tasks_description_length_check" CHECK ((("char_length"("description") >= 10) AND ("char_length"("description") <= 500))),
    CONSTRAINT "tasks_room_requires_property" CHECK ((("room_id" IS NULL) OR ("property_id" IS NOT NULL))),
    CONSTRAINT "tasks_title_length_check" CHECK ((("char_length"("title") >= 2) AND ("char_length"("title") <= 100)))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" NOT NULL,
    "type" "public"."tenant_type" NOT NULL,
    "profile_pic" "text",
    "profile_thumb" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "invite_sent" boolean DEFAULT false,
    "identity_card_url" "text",
    CONSTRAINT "tenants_profile_pic_check" CHECK (("char_length"("profile_pic") <= 1000)),
    CONSTRAINT "tenants_profile_thumb_check" CHECK (("char_length"("profile_thumb") <= 1000))
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assigner_id" "uuid",
    "assigned_id" "uuid",
    "status" "public"."ticket_assignment_status" DEFAULT 'Pending'::"public"."ticket_assignment_status" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "unassigned_at" timestamp with time zone,
    "ticket_id" "uuid" NOT NULL,
    "cancelled_at" timestamp with time zone,
    "unassigned_by" "uuid",
    "cancelled_by" "uuid"
);


ALTER TABLE "public"."ticket_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "attachment" "text",
    "sender_type" "public"."ticket_participant_type" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ticket_id" "uuid" NOT NULL
);


ALTER TABLE "public"."ticket_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_statuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state" "public"."ticket_state" NOT NULL,
    "performer_type" "public"."ticket_participant_type" NOT NULL,
    "performer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    CONSTRAINT "chk_performer_id_by_type" CHECK (((("performer_type" = 'system'::"public"."ticket_participant_type") AND ("performer_id" IS NULL)) OR (("performer_type" = ANY (ARRAY['tenant'::"public"."ticket_participant_type", 'staff'::"public"."ticket_participant_type"])) AND ("performer_id" IS NOT NULL))))
);


ALTER TABLE "public"."ticket_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "ticket_id" "uuid" NOT NULL
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "attachment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reference_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "lease_id" "uuid",
    CONSTRAINT "chk_reference_id_format" CHECK (("reference_id" ~ '^TK-[0-9]{11}$'::"text"))
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "phone_number" "text" NOT NULL,
    "email" "text",
    "organization_id" "uuid",
    CONSTRAINT "email_valid_check" CHECK ((("char_length"("email") >= 5) AND ("char_length"("email") <= 255) AND ("email" ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))),
    CONSTRAINT "name_length_check" CHECK ((("char_length"(("name")::"text") >= 1) AND ("char_length"(("name")::"text") <= 50))),
    CONSTRAINT "phone_number_valid_check" CHECK ((("char_length"("phone_number") >= 8) AND ("char_length"("phone_number") <= 20) AND ("phone_number" ~ '^\+[0-9]+$'::"text")))
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "phone_number" "text",
    "email" "text",
    "property_id" "uuid",
    "room_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" "uuid",
    "reference_id" "text" NOT NULL,
    "viewed_at" timestamp with time zone NOT NULL,
    "lease_id" "uuid",
    "conversion_status" "public"."conversion_status_type" DEFAULT 'Not Decided'::"public"."conversion_status_type" NOT NULL,
    CONSTRAINT "viewed_not_after_created" CHECK (("viewed_at" <= "created_at")),
    CONSTRAINT "views_email_check" CHECK ((("email" IS NULL) OR (("char_length"("email") >= 5) AND ("char_length"("email") <= 255) AND ("email" ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text")))),
    CONSTRAINT "views_first_name_check" CHECK ((("char_length"("first_name") >= 1) AND ("char_length"("first_name") <= 100))),
    CONSTRAINT "views_last_name_check" CHECK ((("char_length"("last_name") >= 1) AND ("char_length"("last_name") <= 100))),
    CONSTRAINT "views_phone_number_check" CHECK ((("phone_number" IS NULL) OR (("char_length"("phone_number") >= 8) AND ("char_length"("phone_number") <= 20) AND ("phone_number" ~ '^\+[0-9]+$'::"text")))),
    CONSTRAINT "views_property_or_room_xor" CHECK (((("property_id" IS NOT NULL) AND ("room_id" IS NULL)) OR (("property_id" IS NULL) AND ("room_id" IS NOT NULL)))),
    CONSTRAINT "views_view_id_check" CHECK (("reference_id" ~ '^VW-[0-9]{4}-[0-9]{4}$'::"text"))
);


ALTER TABLE "public"."views" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."charges"
    ADD CONSTRAINT "charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_expenses"
    ADD CONSTRAINT "company_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_tenants"
    ADD CONSTRAINT "company_tenants_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "public"."company_tenants"
    ADD CONSTRAINT "company_tenants_registration_no_key" UNIQUE ("registration_no");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cron_logs"
    ADD CONSTRAINT "cron_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deduction_charges"
    ADD CONSTRAINT "deduction_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_daily_expense_category"
    ADD CONSTRAINT "financial_daily_expense_categ_organization_id_date_category_key" UNIQUE ("organization_id", "date", "category");



ALTER TABLE ONLY "public"."financial_daily_expense_category"
    ADD CONSTRAINT "financial_daily_expense_category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_daily_occupancy"
    ADD CONSTRAINT "financial_daily_occupancy_organization_id_date_key" UNIQUE ("organization_id", "date");



ALTER TABLE ONLY "public"."financial_daily_occupancy"
    ADD CONSTRAINT "financial_daily_occupancy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_daily_payment_type"
    ADD CONSTRAINT "financial_daily_payment_type_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_daily_property_expense"
    ADD CONSTRAINT "financial_daily_property_expe_property_id_date_category_typ_key" UNIQUE ("property_id", "date", "category", "type");



ALTER TABLE ONLY "public"."financial_daily_property_expense"
    ADD CONSTRAINT "financial_daily_property_expense_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_daily_property"
    ADD CONSTRAINT "financial_daily_property_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_daily_property"
    ADD CONSTRAINT "financial_daily_property_property_id_date_key" UNIQUE ("property_id", "date");



ALTER TABLE ONLY "public"."financial_daily_summary"
    ADD CONSTRAINT "financial_daily_summary_organization_id_date_key" UNIQUE ("organization_id", "date");



ALTER TABLE ONLY "public"."financial_daily_summary"
    ADD CONSTRAINT "financial_daily_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."individual_tenants"
    ADD CONSTRAINT "individual_tenants_identity_number_key" UNIQUE ("identity_number");



ALTER TABLE ONLY "public"."individual_tenants"
    ADD CONSTRAINT "individual_tenants_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "late_payment_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lease_end_schedule"
    ADD CONSTRAINT "lease_end_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations_tenants"
    ADD CONSTRAINT "organizations_tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_expenses"
    ADD CONSTRAINT "owner_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_late_charges_applied"
    ADD CONSTRAINT "payment_late_charges_applied_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_organization_id_title_key" UNIQUE ("organization_id", "title");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_project_id_code_key" UNIQUE ("project_id", "code");



ALTER TABLE ONLY "public"."property_default_initial_charges"
    ADD CONSTRAINT "property_default_initial_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_default_lease_config"
    ADD CONSTRAINT "property_default_lease_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_expenses"
    ADD CONSTRAINT "property_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_images"
    ADD CONSTRAINT "property_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_expenses"
    ADD CONSTRAINT "purchase_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recurring_configs"
    ADD CONSTRAINT "recurring_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refund_decisions"
    ADD CONSTRAINT "refund_decisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refunded_charges"
    ADD CONSTRAINT "refunded_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminder_recipients"
    ADD CONSTRAINT "reminder_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles_permissions"
    ADD CONSTRAINT "roles_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles_permissions"
    ADD CONSTRAINT "roles_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_title_organization_id_key" UNIQUE ("title", "organization_id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_property_id_title_key" UNIQUE ("property_id", "title");



ALTER TABLE ONLY "public"."scheduled_rental_changes"
    ADD CONSTRAINT "scheduled_rental_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_expenses"
    ADD CONSTRAINT "staff_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_staff_id_organization_id_key" UNIQUE ("staff_id", "organization_id");



ALTER TABLE ONLY "public"."task_assignments"
    ADD CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_due_dates"
    ADD CONSTRAINT "task_due_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_priorities"
    ADD CONSTRAINT "task_priorities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_reports"
    ADD CONSTRAINT "task_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_statuses"
    ADD CONSTRAINT "task_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_types"
    ADD CONSTRAINT "task_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_reference_id_organization_id_unique" UNIQUE ("reference_id", "organization_id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_assignments"
    ADD CONSTRAINT "ticket_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_comments"
    ADD CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_statuses"
    ADD CONSTRAINT "ticket_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_reference_id_organization_id_key" UNIQUE ("reference_id", "organization_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "unique_booking_id_per_organization" UNIQUE ("reference_id", "property_id");



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "unique_inspection_task_id" UNIQUE ("inspection_task_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "unique_org_reference" UNIQUE ("organization_id", "reference_id");



ALTER TABLE ONLY "public"."property_default_initial_charges"
    ADD CONSTRAINT "unique_property_charge_type" UNIQUE ("property_id", "charge_type");



ALTER TABLE ONLY "public"."property_default_lease_config"
    ADD CONSTRAINT "unique_property_config" UNIQUE ("property_id");



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "unique_property_days" UNIQUE ("property_id", "days_after_due");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "unique_recurring_payment_per_cycle" UNIQUE ("organization_id", "lease_id", "recurring_config_id", "due_payment_timestamp");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "unique_reference_id_per_organization" UNIQUE ("organization_id", "reference_id");



ALTER TABLE ONLY "public"."views"
    ADD CONSTRAINT "unique_reference_id_per_property" UNIQUE ("reference_id", "property_id");



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "unique_refund_finalization_task_id" UNIQUE ("refund_finalization_task_id");



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "unique_refund_request_task_id" UNIQUE ("refund_request_task_id");



ALTER TABLE ONLY "public"."payment_late_charges_applied"
    ADD CONSTRAINT "unique_rental_payment_late_charge" UNIQUE ("rental_payment_id", "late_charge_config_id");



ALTER TABLE ONLY "public"."property_default_initial_charges"
    ADD CONSTRAINT "unique_room_charge_type" UNIQUE ("room_id", "charge_type");



ALTER TABLE ONLY "public"."property_default_lease_config"
    ADD CONSTRAINT "unique_room_config" UNIQUE ("room_id");



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "unique_room_days" UNIQUE ("room_id", "days_after_due");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."views"
    ADD CONSTRAINT "views_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_fdec_org_date" ON "public"."financial_daily_expense_category" USING "btree" ("organization_id", "date" DESC);



CREATE INDEX "idx_fdo_org_date" ON "public"."financial_daily_occupancy" USING "btree" ("organization_id", "date" DESC);



CREATE INDEX "idx_fdp_org_date" ON "public"."financial_daily_property" USING "btree" ("organization_id", "date" DESC);



CREATE INDEX "idx_fdpe_org_date" ON "public"."financial_daily_property_expense" USING "btree" ("organization_id", "date" DESC);



CREATE INDEX "idx_fdpt_org_date" ON "public"."financial_daily_payment_type" USING "btree" ("organization_id", "date" DESC);



CREATE UNIQUE INDEX "idx_fdpt_unique" ON "public"."financial_daily_payment_type" USING "btree" ("organization_id", "date", "type", COALESCE("project_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



CREATE INDEX "idx_fds_org_date" ON "public"."financial_daily_summary" USING "btree" ("organization_id", "date" DESC);



CREATE INDEX "idx_late_payment_charges" ON "public"."late_payment_charges" USING "btree" ("property_id");



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC) WHERE ("is_read" = false);



CREATE INDEX "idx_payment_late_charges_late_charge_payment" ON "public"."payment_late_charges_applied" USING "btree" ("late_charge_payment_id");



CREATE INDEX "idx_payment_late_charges_organization" ON "public"."payment_late_charges_applied" USING "btree" ("organization_id");



CREATE INDEX "idx_payment_late_charges_rental_payment" ON "public"."payment_late_charges_applied" USING "btree" ("rental_payment_id");



CREATE INDEX "idx_property_default_config" ON "public"."property_default_lease_config" USING "btree" ("property_id");



CREATE INDEX "idx_property_initial_charges" ON "public"."property_default_initial_charges" USING "btree" ("property_id");



CREATE INDEX "idx_recurring_configs_organization_id" ON "public"."recurring_configs" USING "btree" ("organization_id");



CREATE INDEX "idx_reminder_recipients_reminder" ON "public"."reminder_recipients" USING "btree" ("reminder_id");



CREATE INDEX "idx_reminders_pending" ON "public"."reminders" USING "btree" ("remind_at") WHERE ("sent" = false);



CREATE INDEX "idx_scheduled_rental_changes_effective_from" ON "public"."scheduled_rental_changes" USING "btree" ("effective_from");



CREATE INDEX "idx_scheduled_rental_changes_lease_id" ON "public"."scheduled_rental_changes" USING "btree" ("lease_id");



CREATE INDEX "idx_scheduled_rental_changes_status" ON "public"."scheduled_rental_changes" USING "btree" ("status");



CREATE INDEX "idx_task_assignments_task" ON "public"."task_assignments" USING "btree" ("task_id");



CREATE INDEX "idx_task_comments_task" ON "public"."task_comments" USING "btree" ("task_id");



CREATE INDEX "idx_task_due_dates_task" ON "public"."task_due_dates" USING "btree" ("task_id");



CREATE INDEX "idx_task_flow_instances_lease" ON "public"."task_flow_instances" USING "btree" ("lease_id");



CREATE INDEX "idx_task_flow_instances_org" ON "public"."task_flow_instances" USING "btree" ("organization_id");



CREATE INDEX "idx_task_flow_instances_property" ON "public"."task_flow_instances" USING "btree" ("property_id");



CREATE INDEX "idx_task_flow_instances_room" ON "public"."task_flow_instances" USING "btree" ("room_id");



CREATE INDEX "idx_task_flow_instances_type" ON "public"."task_flow_instances" USING "btree" ("flow_type");



CREATE INDEX "idx_task_priorities_task" ON "public"."task_priorities" USING "btree" ("task_id");



CREATE UNIQUE INDEX "idx_task_single_active_assignment" ON "public"."task_assignments" USING "btree" ("task_id") WHERE ("status" = ANY (ARRAY['Pending'::"public"."task_assignment_status", 'Accepted'::"public"."task_assignment_status"]));



CREATE INDEX "idx_task_statuses_task" ON "public"."task_statuses" USING "btree" ("task_id");



CREATE INDEX "idx_task_types_task" ON "public"."task_types" USING "btree" ("task_id");



CREATE INDEX "idx_tasks_flow_instance" ON "public"."tasks" USING "btree" ("flow_instance_id");



CREATE INDEX "idx_tasks_org" ON "public"."tasks" USING "btree" ("organization_id");



CREATE INDEX "idx_tasks_property" ON "public"."tasks" USING "btree" ("property_id");



CREATE INDEX "idx_tasks_room" ON "public"."tasks" USING "btree" ("room_id");



CREATE UNIQUE INDEX "idx_ticket_one_active_assignment" ON "public"."ticket_assignments" USING "btree" ("ticket_id") WHERE ("status" = ANY (ARRAY['Pending'::"public"."ticket_assignment_status", 'Accepted'::"public"."ticket_assignment_status"]));



CREATE UNIQUE INDEX "unique_active_contract_per_property" ON "public"."contracts" USING "btree" ("property_id") WHERE ("status" = 'Current'::"public"."lease_status_new");



CREATE UNIQUE INDEX "unique_current_property_booking" ON "public"."bookings" USING "btree" ("property_id") WHERE (("status" = 'Current'::"public"."booking_status") AND ("room_id" IS NULL));



CREATE UNIQUE INDEX "unique_current_room_booking" ON "public"."bookings" USING "btree" ("room_id") WHERE (("status" = 'Current'::"public"."booking_status") AND ("room_id" IS NOT NULL));



CREATE UNIQUE INDEX "unique_rental_payment_per_cycle" ON "public"."payments" USING "btree" ("organization_id", "lease_id", "due_payment_timestamp") WHERE ("type" = 'Rental'::"public"."payment_type");



CREATE OR REPLACE TRIGGER "check_company_tenant_uniqueness" BEFORE INSERT OR UPDATE ON "public"."company_tenants" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_duplicate_tenant_subtype"();



CREATE OR REPLACE TRIGGER "check_individual_tenant_uniqueness" BEFORE INSERT OR UPDATE ON "public"."individual_tenants" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_duplicate_tenant_subtype"();



CREATE OR REPLACE TRIGGER "enforce_booking_mutual_exclusivity" BEFORE INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."check_booking_mutual_exclusivity"();



CREATE OR REPLACE TRIGGER "enforce_report_submitter_is_assigned" BEFORE INSERT ON "public"."task_reports" FOR EACH ROW EXECUTE FUNCTION "public"."check_report_submitter_is_assigned"();



CREATE OR REPLACE TRIGGER "enforce_terminal_assignment_immutable" BEFORE UPDATE ON "public"."task_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_terminal_assignment_update"();



CREATE OR REPLACE TRIGGER "trg_check_payment_fulfilled" BEFORE INSERT ON "public"."payment_history" FOR EACH ROW EXECUTE FUNCTION "public"."check_payment_fulfilled"();



CREATE OR REPLACE TRIGGER "trg_generate_next_rental_payment" AFTER UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."generate_next_rental_payment"();



CREATE OR REPLACE TRIGGER "trg_prevent_edit_on_resolved_task_assignments" BEFORE INSERT ON "public"."task_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_edit_on_resolved_task"();



CREATE OR REPLACE TRIGGER "trg_prevent_edit_on_resolved_task_comments" BEFORE INSERT ON "public"."task_comments" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_edit_on_resolved_task"();



CREATE OR REPLACE TRIGGER "trg_prevent_edit_on_resolved_task_due_dates" BEFORE INSERT ON "public"."task_due_dates" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_edit_on_resolved_task"();



CREATE OR REPLACE TRIGGER "trg_prevent_edit_on_resolved_task_priorities" BEFORE INSERT ON "public"."task_priorities" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_edit_on_resolved_task"();



CREATE OR REPLACE TRIGGER "trg_prevent_edit_on_resolved_task_types" BEFORE INSERT ON "public"."task_types" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_edit_on_resolved_task"();



CREATE OR REPLACE TRIGGER "trg_prevent_flow_task_type_change" BEFORE INSERT ON "public"."task_types" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_flow_task_type_change"();



CREATE OR REPLACE TRIGGER "trg_prevent_report_on_invalid_state" BEFORE INSERT ON "public"."task_reports" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_report_on_invalid_state"();



CREATE OR REPLACE TRIGGER "trg_prevent_status_after_flow_completed" BEFORE INSERT ON "public"."task_statuses" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_status_after_flow_completed"();



CREATE OR REPLACE TRIGGER "trg_prevent_terminal_update" BEFORE UPDATE ON "public"."ticket_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_terminal_state_update"();



CREATE OR REPLACE TRIGGER "trg_self_assignment" BEFORE INSERT ON "public"."ticket_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_self_assignment"();



CREATE OR REPLACE TRIGGER "trg_validate_lease_insert" BEFORE INSERT ON "public"."leases" FOR EACH ROW EXECUTE FUNCTION "public"."validate_lease_insert"();



CREATE OR REPLACE TRIGGER "trg_validate_lease_property_status" BEFORE INSERT ON "public"."leases" FOR EACH ROW EXECUTE FUNCTION "public"."validate_lease_property_status"();



CREATE OR REPLACE TRIGGER "trg_validate_lease_update" BEFORE UPDATE ON "public"."leases" FOR EACH ROW EXECUTE FUNCTION "public"."validate_lease_update"();



CREATE OR REPLACE TRIGGER "validate_billplz_transaction_trigger" BEFORE INSERT OR UPDATE ON "public"."payment_history" FOR EACH ROW EXECUTE FUNCTION "public"."validate_billplz_transaction"();



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."charges"
    ADD CONSTRAINT "charges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."charges"
    ADD CONSTRAINT "charges_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."charges"
    ADD CONSTRAINT "charges_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id");



ALTER TABLE ONLY "public"."company_expenses"
    ADD CONSTRAINT "company_expenses_claimer_id_fkey" FOREIGN KEY ("claimer_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_expenses"
    ADD CONSTRAINT "company_expenses_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_expenses"
    ADD CONSTRAINT "company_expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_tenants"
    ADD CONSTRAINT "company_tenants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_tenants"
    ADD CONSTRAINT "company_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deduction_charges"
    ADD CONSTRAINT "deduction_charges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deduction_charges"
    ADD CONSTRAINT "deduction_charges_expense_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_recurring_config_id_fkey" FOREIGN KEY ("recurring_config_id") REFERENCES "public"."recurring_configs"("id");



ALTER TABLE ONLY "public"."financial_daily_expense_category"
    ADD CONSTRAINT "financial_daily_expense_category_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_daily_occupancy"
    ADD CONSTRAINT "financial_daily_occupancy_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_daily_payment_type"
    ADD CONSTRAINT "financial_daily_payment_type_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_daily_payment_type"
    ADD CONSTRAINT "financial_daily_payment_type_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."financial_daily_property_expense"
    ADD CONSTRAINT "financial_daily_property_expense_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_daily_property_expense"
    ADD CONSTRAINT "financial_daily_property_expense_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_daily_property"
    ADD CONSTRAINT "financial_daily_property_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_daily_property"
    ADD CONSTRAINT "financial_daily_property_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_daily_summary"
    ADD CONSTRAINT "financial_daily_summary_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."charges"
    ADD CONSTRAINT "fk_expense" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "fk_lease" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "fk_owner" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."charges"
    ADD CONSTRAINT "fk_payment" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "fk_property" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refund_decisions"
    ADD CONSTRAINT "fk_refund_decisions_flow_instance" FOREIGN KEY ("flow_instance_id") REFERENCES "public"."task_flow_instances"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."refund_decisions"
    ADD CONSTRAINT "fk_refund_decisions_lease" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refund_decisions"
    ADD CONSTRAINT "fk_refund_decisions_organization" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refund_decisions"
    ADD CONSTRAINT "fk_refund_decisions_reviewed" FOREIGN KEY ("reviewed_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."refund_decisions"
    ADD CONSTRAINT "fk_refund_decisions_submitted" FOREIGN KEY ("submitted_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."refund_decisions"
    ADD CONSTRAINT "fk_refund_decisions_task" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."refunded_charges"
    ADD CONSTRAINT "fk_refunded_charges_refund_decision" FOREIGN KEY ("refund_decision_id") REFERENCES "public"."refund_decisions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "fk_room" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."individual_tenants"
    ADD CONSTRAINT "individual_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "late_payment_charges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "late_payment_charges_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id");



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "late_payment_charges_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."late_payment_charges"
    ADD CONSTRAINT "late_payment_charges_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lease_end_schedule"
    ADD CONSTRAINT "lease_end_schedule_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lease_end_schedule"
    ADD CONSTRAINT "lease_end_schedule_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lease_end_schedule"
    ADD CONSTRAINT "lease_end_schedule_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lease_end_schedule"
    ADD CONSTRAINT "lease_end_schedule_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_transferred_from_fkey" FOREIGN KEY ("transferred_from") REFERENCES "public"."leases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leases"
    ADD CONSTRAINT "leases_transferred_to_fkey" FOREIGN KEY ("transferred_to") REFERENCES "public"."leases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organizations_tenants"
    ADD CONSTRAINT "organizations_tenants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organizations_tenants"
    ADD CONSTRAINT "organizations_tenants_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations_tenants"
    ADD CONSTRAINT "organizations_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_expenses"
    ADD CONSTRAINT "owner_expenses_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id");



ALTER TABLE ONLY "public"."contract_expenses"
    ADD CONSTRAINT "owner_expenses_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id");



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_registrar_fkey" FOREIGN KEY ("registrar") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."payment_late_charges_applied"
    ADD CONSTRAINT "payment_late_charges_applied_late_charge_config_fkey" FOREIGN KEY ("late_charge_config_id") REFERENCES "public"."late_payment_charges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_late_charges_applied"
    ADD CONSTRAINT "payment_late_charges_applied_late_charge_payment_fkey" FOREIGN KEY ("late_charge_payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_late_charges_applied"
    ADD CONSTRAINT "payment_late_charges_applied_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_late_charges_applied"
    ADD CONSTRAINT "payment_late_charges_applied_rental_payment_fkey" FOREIGN KEY ("rental_payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_recurring_config_id_fkey" FOREIGN KEY ("recurring_config_id") REFERENCES "public"."recurring_configs"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."property_default_initial_charges"
    ADD CONSTRAINT "property_default_initial_charges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_default_initial_charges"
    ADD CONSTRAINT "property_default_initial_charges_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_default_initial_charges"
    ADD CONSTRAINT "property_default_initial_charges_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_default_lease_config"
    ADD CONSTRAINT "property_default_lease_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_default_lease_config"
    ADD CONSTRAINT "property_default_lease_config_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_default_lease_config"
    ADD CONSTRAINT "property_default_lease_config_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_expenses"
    ADD CONSTRAINT "property_expenses_claimer_id_fkey" FOREIGN KEY ("claimer_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_expenses"
    ADD CONSTRAINT "property_expenses_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_expenses"
    ADD CONSTRAINT "property_expenses_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id");



ALTER TABLE ONLY "public"."property_expenses"
    ADD CONSTRAINT "property_expenses_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."property_expenses"
    ADD CONSTRAINT "property_expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."property_images"
    ADD CONSTRAINT "property_images_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."property_images"
    ADD CONSTRAINT "property_images_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."property_images"
    ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."property_images"
    ADD CONSTRAINT "property_images_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."purchase_expenses"
    ADD CONSTRAINT "purchase_expenses_claimer_id_fkey" FOREIGN KEY ("claimer_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_expenses"
    ADD CONSTRAINT "purchase_expenses_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_expenses"
    ADD CONSTRAINT "purchase_expenses_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."purchase_expenses"
    ADD CONSTRAINT "purchase_expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recurring_configs"
    ADD CONSTRAINT "recurring_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recurring_configs"
    ADD CONSTRAINT "recurring_configs_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id");



ALTER TABLE ONLY "public"."recurring_configs"
    ADD CONSTRAINT "recurring_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_configs"
    ADD CONSTRAINT "recurring_configs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."reminder_recipients"
    ADD CONSTRAINT "reminder_recipients_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."roles_permissions"
    ADD CONSTRAINT "roles_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."roles_permissions"
    ADD CONSTRAINT "roles_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."roles_permissions"
    ADD CONSTRAINT "roles_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scheduled_rental_changes"
    ADD CONSTRAINT "scheduled_rental_changes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scheduled_rental_changes"
    ADD CONSTRAINT "scheduled_rental_changes_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."staff_expenses"
    ADD CONSTRAINT "staff_expenses_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_expenses"
    ADD CONSTRAINT "staff_expenses_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."task_assignments"
    ADD CONSTRAINT "task_assignments_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_assignments"
    ADD CONSTRAINT "task_assignments_assigner_id_fkey" FOREIGN KEY ("assigner_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_assignments"
    ADD CONSTRAINT "task_assignments_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_assignments"
    ADD CONSTRAINT "task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_assignments"
    ADD CONSTRAINT "task_assignments_unassigned_by_fkey" FOREIGN KEY ("unassigned_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_due_dates"
    ADD CONSTRAINT "task_due_dates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_due_dates"
    ADD CONSTRAINT "task_due_dates_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_inspection_task_id_fkey" FOREIGN KEY ("inspection_task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_refund_finalization_task_id_fkey" FOREIGN KEY ("refund_finalization_task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_refund_request_task_id_fkey" FOREIGN KEY ("refund_request_task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_flow_instances"
    ADD CONSTRAINT "task_flow_instances_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_priorities"
    ADD CONSTRAINT "task_priorities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_priorities"
    ADD CONSTRAINT "task_priorities_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_reports"
    ADD CONSTRAINT "task_reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_reports"
    ADD CONSTRAINT "task_reports_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_statuses"
    ADD CONSTRAINT "task_statuses_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_types"
    ADD CONSTRAINT "task_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_types"
    ADD CONSTRAINT "task_types_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_flow_instance_id_fkey" FOREIGN KEY ("flow_instance_id") REFERENCES "public"."task_flow_instances"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_assignments"
    ADD CONSTRAINT "ticket_assignments_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_assignments"
    ADD CONSTRAINT "ticket_assignments_assigner_id_fkey" FOREIGN KEY ("assigner_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_assignments"
    ADD CONSTRAINT "ticket_assignments_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_assignments"
    ADD CONSTRAINT "ticket_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_assignments"
    ADD CONSTRAINT "ticket_assignments_unassigned_by_fkey" FOREIGN KEY ("unassigned_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_comments"
    ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_statuses"
    ADD CONSTRAINT "ticket_statuses_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."views"
    ADD CONSTRAINT "views_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."views"
    ADD CONSTRAINT "views_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."views"
    ADD CONSTRAINT "views_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."views"
    ADD CONSTRAINT "views_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can delete roles" ON "public"."roles" FOR DELETE USING ((("organization_id" = "public"."get_user_org_id"()) AND "public"."is_admin"()));



CREATE POLICY "Admin can delete staff" ON "public"."staff" FOR DELETE USING ((("organization_id" = "public"."get_user_org_id"()) AND "public"."is_admin"()));



CREATE POLICY "Admin can delete their organization" ON "public"."organizations" FOR DELETE USING (("public"."is_staff_in_org"("id") AND "public"."is_admin"()));



CREATE POLICY "Admin can insert roles" ON "public"."roles" FOR INSERT WITH CHECK ((("organization_id" = "public"."get_user_org_id"()) AND "public"."is_admin"()));



CREATE POLICY "Admin can manage permissions" ON "public"."permissions" USING ("public"."is_admin"());



CREATE POLICY "Admin can manage role permissions" ON "public"."roles_permissions" USING (((EXISTS ( SELECT 1
   FROM "public"."roles"
  WHERE (("roles"."id" = "roles_permissions"."role_id") AND ("roles"."organization_id" = "public"."get_user_org_id"())))) AND "public"."is_admin"()));



CREATE POLICY "Admin can update roles" ON "public"."roles" FOR UPDATE USING ((("organization_id" = "public"."get_user_org_id"()) AND "public"."is_admin"()));



CREATE POLICY "Admin can update staff" ON "public"."staff" FOR UPDATE USING ((("organization_id" = "public"."get_user_org_id"()) AND "public"."is_admin"()));



CREATE POLICY "Admin can update their organization" ON "public"."organizations" FOR UPDATE USING (("public"."is_staff_in_org"("id") AND "public"."is_admin"()));



CREATE POLICY "Allow staff creation" ON "public"."staff" FOR INSERT WITH CHECK ((("auth"."uid"() = "id") OR ("public"."is_staff_in_org"("organization_id") AND "public"."is_admin"())));



CREATE POLICY "Authenticated users can add comments" ON "public"."ticket_comments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can add statuses" ON "public"."ticket_statuses" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can add types" ON "public"."ticket_types" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can view assignments" ON "public"."ticket_assignments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view comments" ON "public"."ticket_comments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view statuses" ON "public"."ticket_statuses" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view tickets" ON "public"."tickets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view types" ON "public"."ticket_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Everyone can view permissions" ON "public"."permissions" FOR SELECT USING (true);



CREATE POLICY "Service role can add statuses" ON "public"."ticket_statuses" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role has full access" ON "public"."payment_late_charges_applied" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to cron logs" ON "public"."cron_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Staff can create assignments" ON "public"."ticket_assignments" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'user_type'::"text") = 'staff'::"text"));



CREATE POLICY "Staff can create organization" ON "public"."organizations" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Staff can create scheduled rental changes" ON "public"."scheduled_rental_changes" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."leases" "l"
  WHERE (("l"."id" = "scheduled_rental_changes"."lease_id") AND ("l"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can create task assignments in their organization" ON "public"."task_assignments" FOR INSERT TO "authenticated" WITH CHECK (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can create task comments in their organization" ON "public"."task_comments" FOR INSERT TO "authenticated" WITH CHECK (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can create task due dates in their organization" ON "public"."task_due_dates" FOR INSERT TO "authenticated" WITH CHECK (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can create task priorities in their organization" ON "public"."task_priorities" FOR INSERT TO "authenticated" WITH CHECK (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can create task reports in their organization" ON "public"."task_reports" FOR INSERT TO "authenticated" WITH CHECK (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can create task statuses in their organization" ON "public"."task_statuses" FOR INSERT TO "authenticated" WITH CHECK (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can create task types in their organization" ON "public"."task_types" FOR INSERT TO "authenticated" WITH CHECK (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can create tasks in their organization" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Staff can create tenants" ON "public"."tenants" FOR INSERT WITH CHECK ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can delete contracts" ON "public"."contracts" FOR DELETE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can delete leases" ON "public"."leases" FOR DELETE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can delete owners" ON "public"."owners" FOR DELETE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can delete projects" ON "public"."projects" FOR DELETE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can delete properties" ON "public"."properties" FOR DELETE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can delete property/room images" ON "public"."property_images" FOR DELETE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can delete recurring configs in their organization" ON "public"."recurring_configs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."staff" "s"
  WHERE (("s"."organization_id" = "recurring_configs"."organization_id") AND ("s"."id" = "auth"."uid"())))));



CREATE POLICY "Staff can delete rooms" ON "public"."rooms" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "rooms"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can insert own organization flow instances" ON "public"."task_flow_instances" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Staff can insert property/room images" ON "public"."property_images" FOR INSERT WITH CHECK (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can insert recurring configs in their organization" ON "public"."recurring_configs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff" "s"
  WHERE (("s"."organization_id" = "recurring_configs"."organization_id") AND ("s"."id" = "auth"."uid"())))));



CREATE POLICY "Staff can manage bookings" ON "public"."bookings" USING ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can manage charges" ON "public"."charges" USING (((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "charges"."payment_id") AND ("payments"."organization_id" = "public"."get_user_org_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "charges"."expense_id") AND ("expenses"."organization_id" = "public"."get_user_org_id"()))))));



CREATE POLICY "Staff can manage company expenses" ON "public"."company_expenses" USING ((EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "company_expenses"."id") AND ("expenses"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage company tenants" ON "public"."company_tenants" FOR INSERT WITH CHECK ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can manage contract expenses" ON "public"."contract_expenses" USING ((EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "contract_expenses"."id") AND ("expenses"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage contracts" ON "public"."contracts" FOR INSERT WITH CHECK (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can manage deduction_charges" ON "public"."deduction_charges" USING ((EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "deduction_charges"."expense_id") AND ("expenses"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage expenses" ON "public"."expenses" USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can manage individual tenants" ON "public"."individual_tenants" FOR INSERT WITH CHECK ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can manage late payment charges" ON "public"."late_payment_charges" USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "late_payment_charges"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage leases" ON "public"."leases" FOR INSERT WITH CHECK (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can manage owners" ON "public"."owners" FOR INSERT WITH CHECK (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can manage payment history" ON "public"."payment_history" USING (((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "payment_history"."payment_id") AND ("payments"."organization_id" = "public"."get_user_org_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "payment_history"."expense_id") AND ("expenses"."organization_id" = "public"."get_user_org_id"()))))));



CREATE POLICY "Staff can manage payments" ON "public"."payments" USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can manage projects" ON "public"."projects" FOR INSERT WITH CHECK (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can manage properties" ON "public"."properties" FOR INSERT WITH CHECK (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can manage property default config" ON "public"."property_default_lease_config" USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_default_lease_config"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage property default initial charges" ON "public"."property_default_initial_charges" USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_default_initial_charges"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage property expenses" ON "public"."property_expenses" USING ((EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "property_expenses"."id") AND ("expenses"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage purchase expenses" ON "public"."purchase_expenses" USING ((EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "purchase_expenses"."id") AND ("expenses"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage rooms" ON "public"."rooms" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "rooms"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage staff expenses" ON "public"."staff_expenses" USING ((EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "staff_expenses"."id") AND ("expenses"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can manage tenants in their organization" ON "public"."organizations_tenants" USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can manage views" ON "public"."views" USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "views"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can update assignments" ON "public"."ticket_assignments" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'user_type'::"text") = 'staff'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'user_type'::"text") = 'staff'::"text"));



CREATE POLICY "Staff can update company tenants" ON "public"."company_tenants" FOR UPDATE USING ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can update contracts" ON "public"."contracts" FOR UPDATE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can update individual tenants" ON "public"."individual_tenants" FOR UPDATE USING ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can update leases" ON "public"."leases" FOR UPDATE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can update own organization flow instances" ON "public"."task_flow_instances" FOR UPDATE USING (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Staff can update owners" ON "public"."owners" FOR UPDATE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can update projects" ON "public"."projects" FOR UPDATE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can update properties" ON "public"."properties" FOR UPDATE USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can update property/room images" ON "public"."property_images" FOR UPDATE USING (("organization_id" = "public"."get_user_org_id"())) WITH CHECK (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can update recurring configs in their organization" ON "public"."recurring_configs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."organization_id" = "recurring_configs"."organization_id") AND ("staff"."id" = "auth"."uid"())))));



CREATE POLICY "Staff can update rooms" ON "public"."rooms" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "rooms"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can update scheduled rental changes" ON "public"."scheduled_rental_changes" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."leases" "l"
  WHERE (("l"."id" = "scheduled_rental_changes"."lease_id") AND ("l"."organization_id" = "public"."get_user_org_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."leases" "l"
  WHERE (("l"."id" = "scheduled_rental_changes"."lease_id") AND ("l"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can update task assignments in their organization" ON "public"."task_assignments" FOR UPDATE TO "authenticated" USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can update tasks in their organization" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Staff can update tenants" ON "public"."tenants" FOR UPDATE USING ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can view all bookings" ON "public"."bookings" FOR SELECT USING ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can view charges" ON "public"."charges" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "charges"."payment_id") AND ("payments"."organization_id" = "public"."get_user_org_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "charges"."expense_id") AND ("expenses"."organization_id" = "public"."get_user_org_id"()))))));



CREATE POLICY "Staff can view company tenants" ON "public"."company_tenants" FOR SELECT USING ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can view contracts in their organization" ON "public"."contracts" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view expenses in their organization" ON "public"."expenses" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view individual tenants" ON "public"."individual_tenants" FOR SELECT USING ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can view late payment charges in their organization" ON "public"."late_payment_charges" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "late_payment_charges"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can view leases in their organization" ON "public"."leases" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view own organization flow instances" ON "public"."task_flow_instances" FOR SELECT USING (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Staff can view owners in their organization" ON "public"."owners" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view payment history" ON "public"."payment_history" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."payments"
  WHERE (("payments"."id" = "payment_history"."payment_id") AND ("payments"."organization_id" = "public"."get_user_org_id"())))) OR (EXISTS ( SELECT 1
   FROM "public"."expenses"
  WHERE (("expenses"."id" = "payment_history"."expense_id") AND ("expenses"."organization_id" = "public"."get_user_org_id"()))))));



CREATE POLICY "Staff can view payments in their organization" ON "public"."payments" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view projects in their organization" ON "public"."projects" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view properties in their organization" ON "public"."properties" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view property default config in their organization" ON "public"."property_default_lease_config" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_default_lease_config"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can view property default initial charges in their organi" ON "public"."property_default_initial_charges" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_default_initial_charges"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can view property views" ON "public"."views" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "views"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can view property/room images" ON "public"."property_images" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view role permissions" ON "public"."roles_permissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."roles"
  WHERE (("roles"."id" = "roles_permissions"."role_id") AND ("roles"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can view roles in their organization" ON "public"."roles" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view rooms in their organization" ON "public"."rooms" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "rooms"."property_id") AND ("properties"."organization_id" = "public"."get_user_org_id"())))));



CREATE POLICY "Staff can view staff in their organization" ON "public"."staff" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view task assignments in their organization" ON "public"."task_assignments" FOR SELECT TO "authenticated" USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can view task comments in their organization" ON "public"."task_comments" FOR SELECT TO "authenticated" USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can view task due dates in their organization" ON "public"."task_due_dates" FOR SELECT TO "authenticated" USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can view task priorities in their organization" ON "public"."task_priorities" FOR SELECT TO "authenticated" USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can view task reports in their organization" ON "public"."task_reports" FOR SELECT TO "authenticated" USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can view task statuses in their organization" ON "public"."task_statuses" FOR SELECT TO "authenticated" USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can view task types in their organization" ON "public"."task_types" FOR SELECT TO "authenticated" USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE ("tasks"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Staff can view tasks in their organization" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Staff can view tenants" ON "public"."tenants" FOR SELECT USING ("public"."is_staff_in_org"("public"."get_user_org_id"()));



CREATE POLICY "Staff can view tenants in their organization" ON "public"."organizations_tenants" FOR SELECT USING (("organization_id" = "public"."get_user_org_id"()));



CREATE POLICY "Staff can view their organization's applied late charges" ON "public"."payment_late_charges_applied" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Staff can view their own organization" ON "public"."organizations" FOR SELECT USING ("public"."is_staff_in_org"("id"));



CREATE POLICY "Tenants can create tickets" ON "public"."tickets" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'user_type'::"text") = 'tenant'::"text"));



CREATE POLICY "Tenants can view their own bookings" ON "public"."bookings" FOR SELECT USING (("tenant_id" = "auth"."uid"()));



CREATE POLICY "Tenants can view their own charges" ON "public"."charges" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."payments"
     JOIN "public"."leases" ON (("leases"."id" = "payments"."lease_id")))
  WHERE (("payments"."id" = "charges"."payment_id") AND ("leases"."tenant_id" = "auth"."uid"())))));



CREATE POLICY "Tenants can view their own company data" ON "public"."company_tenants" FOR SELECT USING (("tenant_id" = "auth"."uid"()));



CREATE POLICY "Tenants can view their own data" ON "public"."tenants" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Tenants can view their own individual data" ON "public"."individual_tenants" FOR SELECT USING (("tenant_id" = "auth"."uid"()));



CREATE POLICY "Tenants can view their own leases" ON "public"."leases" FOR SELECT USING (("tenant_id" = "auth"."uid"()));



CREATE POLICY "Tenants can view their own payment history" ON "public"."payment_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."payments"
     JOIN "public"."leases" ON (("leases"."id" = "payments"."lease_id")))
  WHERE (("payments"."id" = "payment_history"."payment_id") AND ("leases"."tenant_id" = "auth"."uid"())))));



CREATE POLICY "Tenants can view their own payments" ON "public"."payments" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."leases"
  WHERE (("leases"."id" = "payments"."lease_id") AND ("leases"."tenant_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "payments"."booking_id") AND ("bookings"."tenant_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert refund decisions in their organization" ON "public"."refund_decisions" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Users can insert refunded charges in their organization" ON "public"."refunded_charges" FOR INSERT WITH CHECK (("refund_decision_id" IN ( SELECT "refund_decisions"."id"
   FROM "public"."refund_decisions"
  WHERE ("refund_decisions"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Users can update refund decisions in their organization" ON "public"."refund_decisions" FOR UPDATE USING (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view recurring configs in their organization" ON "public"."recurring_configs" FOR SELECT USING (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"())
UNION
 SELECT "recurring_configs"."organization_id"
   FROM "public"."tenants"
  WHERE ("tenants"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view refund decisions in their organization" ON "public"."refund_decisions" FOR SELECT USING (("organization_id" IN ( SELECT "staff"."organization_id"
   FROM "public"."staff"
  WHERE ("staff"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view refunded charges in their organization" ON "public"."refunded_charges" FOR SELECT USING (("refund_decision_id" IN ( SELECT "refund_decisions"."id"
   FROM "public"."refund_decisions"
  WHERE ("refund_decisions"."organization_id" IN ( SELECT "staff"."organization_id"
           FROM "public"."staff"
          WHERE ("staff"."id" = "auth"."uid"()))))));



CREATE POLICY "Users can view scheduled rental changes" ON "public"."scheduled_rental_changes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."leases" "l"
  WHERE (("l"."id" = "scheduled_rental_changes"."lease_id") AND (("l"."organization_id" = "public"."get_user_org_id"()) OR ("l"."tenant_id" = "auth"."uid"()))))));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."charges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cron_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deduction_charges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."individual_tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."late_payment_charges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations_tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_late_charges_applied" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_default_initial_charges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_default_lease_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurring_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refund_decisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refunded_charges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scheduled_rental_changes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_due_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_flow_instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_priorities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."views" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."apply_late_payment_charges"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_late_payment_charges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_late_payment_charges"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_resolve_stale_pending_tickets"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_resolve_stale_pending_tickets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_resolve_stale_pending_tickets"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_booking_mutual_exclusivity"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_booking_mutual_exclusivity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_booking_mutual_exclusivity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_payment_fulfilled"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_payment_fulfilled"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_payment_fulfilled"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_report_submitter_is_assigned"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_report_submitter_is_assigned"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_report_submitter_is_assigned"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_contract_rental_expenses"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_contract_rental_expenses"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_contract_rental_expenses"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_next_rental_payment"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_next_rental_payment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_next_rental_payment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_recurring_expenses"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_recurring_expenses"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_recurring_expenses"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_self_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_self_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_self_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff_in_org"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff_in_org"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff_in_org"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_tenant"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_tenant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_tenant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_daily_occupancy"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."populate_daily_occupancy"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_daily_occupancy"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_monthly_expense_category"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."populate_monthly_expense_category"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_monthly_expense_category"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_monthly_payment_type"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."populate_monthly_payment_type"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_monthly_payment_type"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_monthly_property"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."populate_monthly_property"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_monthly_property"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_monthly_property_expense"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."populate_monthly_property_expense"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_monthly_property_expense"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_monthly_summary"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."populate_monthly_summary"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_monthly_summary"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_duplicate_tenant_subtype"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_duplicate_tenant_subtype"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_duplicate_tenant_subtype"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_edit_on_resolved_task"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_edit_on_resolved_task"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_edit_on_resolved_task"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_flow_task_type_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_flow_task_type_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_flow_task_type_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_report_on_invalid_state"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_report_on_invalid_state"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_report_on_invalid_state"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_status_after_flow_completed"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_status_after_flow_completed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_status_after_flow_completed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_terminal_assignment_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_terminal_assignment_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_terminal_assignment_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_terminal_state_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_terminal_state_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_terminal_state_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_all_orgs_financial_warehouse"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_all_orgs_financial_warehouse"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_all_orgs_financial_warehouse"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_financial_warehouse"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."run_financial_warehouse"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_financial_warehouse"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_billplz_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_billplz_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_billplz_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_lease_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_lease_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_lease_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_lease_property_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_lease_property_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_lease_property_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_lease_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_lease_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_lease_update"() TO "service_role";
























GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."charges" TO "anon";
GRANT ALL ON TABLE "public"."charges" TO "authenticated";
GRANT ALL ON TABLE "public"."charges" TO "service_role";



GRANT ALL ON TABLE "public"."company_expenses" TO "anon";
GRANT ALL ON TABLE "public"."company_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."company_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."company_tenants" TO "anon";
GRANT ALL ON TABLE "public"."company_tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."company_tenants" TO "service_role";



GRANT ALL ON TABLE "public"."contract_expenses" TO "anon";
GRANT ALL ON TABLE "public"."contract_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."cron_logs" TO "anon";
GRANT ALL ON TABLE "public"."cron_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_logs" TO "service_role";



GRANT ALL ON TABLE "public"."deduction_charges" TO "anon";
GRANT ALL ON TABLE "public"."deduction_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."deduction_charges" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."financial_daily_expense_category" TO "anon";
GRANT ALL ON TABLE "public"."financial_daily_expense_category" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_daily_expense_category" TO "service_role";



GRANT ALL ON TABLE "public"."financial_daily_occupancy" TO "anon";
GRANT ALL ON TABLE "public"."financial_daily_occupancy" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_daily_occupancy" TO "service_role";



GRANT ALL ON TABLE "public"."financial_daily_payment_type" TO "anon";
GRANT ALL ON TABLE "public"."financial_daily_payment_type" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_daily_payment_type" TO "service_role";



GRANT ALL ON TABLE "public"."financial_daily_property" TO "anon";
GRANT ALL ON TABLE "public"."financial_daily_property" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_daily_property" TO "service_role";



GRANT ALL ON TABLE "public"."financial_daily_property_expense" TO "anon";
GRANT ALL ON TABLE "public"."financial_daily_property_expense" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_daily_property_expense" TO "service_role";



GRANT ALL ON TABLE "public"."financial_daily_summary" TO "anon";
GRANT ALL ON TABLE "public"."financial_daily_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_daily_summary" TO "service_role";



GRANT ALL ON TABLE "public"."individual_tenants" TO "anon";
GRANT ALL ON TABLE "public"."individual_tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."individual_tenants" TO "service_role";



GRANT ALL ON TABLE "public"."late_payment_charges" TO "anon";
GRANT ALL ON TABLE "public"."late_payment_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."late_payment_charges" TO "service_role";



GRANT ALL ON TABLE "public"."lease_end_schedule" TO "anon";
GRANT ALL ON TABLE "public"."lease_end_schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."lease_end_schedule" TO "service_role";



GRANT ALL ON TABLE "public"."leases" TO "anon";
GRANT ALL ON TABLE "public"."leases" TO "authenticated";
GRANT ALL ON TABLE "public"."leases" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."organizations_tenants" TO "anon";
GRANT ALL ON TABLE "public"."organizations_tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations_tenants" TO "service_role";



GRANT ALL ON TABLE "public"."owners" TO "anon";
GRANT ALL ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."payment_history" TO "anon";
GRANT ALL ON TABLE "public"."payment_history" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_history" TO "service_role";



GRANT ALL ON TABLE "public"."payment_late_charges_applied" TO "anon";
GRANT ALL ON TABLE "public"."payment_late_charges_applied" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_late_charges_applied" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payment_reference_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payment_reference_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payment_reference_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_default_initial_charges" TO "anon";
GRANT ALL ON TABLE "public"."property_default_initial_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."property_default_initial_charges" TO "service_role";



GRANT ALL ON TABLE "public"."property_default_lease_config" TO "anon";
GRANT ALL ON TABLE "public"."property_default_lease_config" TO "authenticated";
GRANT ALL ON TABLE "public"."property_default_lease_config" TO "service_role";



GRANT ALL ON TABLE "public"."property_expenses" TO "anon";
GRANT ALL ON TABLE "public"."property_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."property_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."property_images" TO "anon";
GRANT ALL ON TABLE "public"."property_images" TO "authenticated";
GRANT ALL ON TABLE "public"."property_images" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_expenses" TO "anon";
GRANT ALL ON TABLE "public"."purchase_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."recurring_configs" TO "anon";
GRANT ALL ON TABLE "public"."recurring_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."recurring_configs" TO "service_role";



GRANT ALL ON TABLE "public"."refund_decisions" TO "anon";
GRANT ALL ON TABLE "public"."refund_decisions" TO "authenticated";
GRANT ALL ON TABLE "public"."refund_decisions" TO "service_role";



GRANT ALL ON TABLE "public"."refunded_charges" TO "anon";
GRANT ALL ON TABLE "public"."refunded_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."refunded_charges" TO "service_role";



GRANT ALL ON TABLE "public"."reminder_recipients" TO "anon";
GRANT ALL ON TABLE "public"."reminder_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."reminder_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."reminders" TO "anon";
GRANT ALL ON TABLE "public"."reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."reminders" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."roles_permissions" TO "anon";
GRANT ALL ON TABLE "public"."roles_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."roles_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_rental_changes" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_rental_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_rental_changes" TO "service_role";



GRANT ALL ON TABLE "public"."staff" TO "anon";
GRANT ALL ON TABLE "public"."staff" TO "authenticated";
GRANT ALL ON TABLE "public"."staff" TO "service_role";



GRANT ALL ON TABLE "public"."staff_expenses" TO "anon";
GRANT ALL ON TABLE "public"."staff_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."task_assignments" TO "anon";
GRANT ALL ON TABLE "public"."task_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."task_due_dates" TO "anon";
GRANT ALL ON TABLE "public"."task_due_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."task_due_dates" TO "service_role";



GRANT ALL ON TABLE "public"."task_flow_instances" TO "anon";
GRANT ALL ON TABLE "public"."task_flow_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."task_flow_instances" TO "service_role";



GRANT ALL ON TABLE "public"."task_priorities" TO "anon";
GRANT ALL ON TABLE "public"."task_priorities" TO "authenticated";
GRANT ALL ON TABLE "public"."task_priorities" TO "service_role";



GRANT ALL ON TABLE "public"."task_reports" TO "anon";
GRANT ALL ON TABLE "public"."task_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."task_reports" TO "service_role";



GRANT ALL ON TABLE "public"."task_statuses" TO "anon";
GRANT ALL ON TABLE "public"."task_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."task_statuses" TO "service_role";



GRANT ALL ON TABLE "public"."task_types" TO "anon";
GRANT ALL ON TABLE "public"."task_types" TO "authenticated";
GRANT ALL ON TABLE "public"."task_types" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_assignments" TO "anon";
GRANT ALL ON TABLE "public"."ticket_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_comments" TO "anon";
GRANT ALL ON TABLE "public"."ticket_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_comments" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_statuses" TO "anon";
GRANT ALL ON TABLE "public"."ticket_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_statuses" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_types" TO "anon";
GRANT ALL ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON TABLE "public"."views" TO "anon";
GRANT ALL ON TABLE "public"."views" TO "authenticated";
GRANT ALL ON TABLE "public"."views" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


  create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'tickets'::text));



  create policy "Allow authenticated users to upload to staff"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'staff'::text));



  create policy "Allow authenticated users to upload to tenants"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'tenants'::text));



  create policy "Allow authenticated users to upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'owners'::text));



  create policy "Allow public read access to staff"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'staff'::text));



  create policy "Allow public read access to tenants"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'tenants'::text));



  create policy "Allow public read access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'owners'::text));



  create policy "Allow staff update tasks files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'tasks'::text) AND (EXISTS ( SELECT 1
   FROM public.staff
  WHERE (staff.id = auth.uid())))))
with check (((bucket_id = 'tasks'::text) AND (EXISTS ( SELECT 1
   FROM public.staff
  WHERE (staff.id = auth.uid())))));



  create policy "Allow staff uploads to tasks"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'tasks'::text) AND (EXISTS ( SELECT 1
   FROM public.staff
  WHERE (staff.id = auth.uid())))));



  create policy "Staff can delete properties files"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'properties'::text) AND (EXISTS ( SELECT 1
   FROM public.staff
  WHERE (staff.id = auth.uid())))));



  create policy "Staff can delete receipts"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'receipts'::text) AND (auth.uid() IN ( SELECT staff.id
   FROM public.staff))));



  create policy "Staff can update properties files"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'properties'::text) AND (EXISTS ( SELECT 1
   FROM public.staff
  WHERE (staff.id = auth.uid())))));



  create policy "Staff can upload payment evidence"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'payment-evidence'::text) AND (EXISTS ( SELECT 1
   FROM public.staff
  WHERE (staff.id = auth.uid())))));



  create policy "Staff can upload properties files"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'properties'::text) AND (EXISTS ( SELECT 1
   FROM public.staff
  WHERE (staff.id = auth.uid())))));



  create policy "Staff can upload receipts"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'receipts'::text) AND (auth.uid() IN ( SELECT staff.id
   FROM public.staff))));



  create policy "Staff can view properties files"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'properties'::text) AND (EXISTS ( SELECT 1
   FROM public.staff
  WHERE (staff.id = auth.uid())))));



  create policy "Staff can view receipts in their organization"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'receipts'::text) AND (auth.uid() IN ( SELECT s1.id
   FROM public.staff s1
  WHERE (s1.organization_id IN ( SELECT s2.organization_id
           FROM public.staff s2
          WHERE (s2.id = auth.uid())))))));



