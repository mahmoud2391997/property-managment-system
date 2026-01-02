import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

// Helper function to parse lease conflict errors from database trigger
function parseLeaseConflictError (errorMessage: string): string | null {
  if (!errorMessage) return null

  // Error codes from validate_lease_insert trigger
  const errorMappings: Record<string, (refId?: string) => string> = {
    'LEASE_ERROR:ENDED_NO_END_DATE': () =>
      'Cannot create lease with status Ended without an end date',
    'LEASE_ERROR:ENDED_FUTURE_DATE': () =>
      'Cannot create lease with status Ended when end date is in the future',
    'LEASE_CONFLICT:PROPERTY_HAS_LEASE': refId =>
      `Property already has an active lease (${refId})`,
    'LEASE_CONFLICT:ROOM_HAS_LEASE': refId =>
      `Room already has an active lease (${refId})`,
    'LEASE_CONFLICT:ROOM_HAS_ACTIVE_LEASE': refId =>
      `Cannot create property lease: A room under this property has an active lease (${refId})`
  }

  for (const [code, getMessage] of Object.entries(errorMappings)) {
    if (errorMessage.includes(code)) {
      // Extract reference ID if present (format: CODE:REF_ID)
      const parts = errorMessage.split(code + ':')
      const refId = parts[1]?.split(/[\s\n]/)[0]?.trim()
      return getMessage(refId)
    }
  }

  return null
}

export async function POST (request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const body = await request.json()
    const {
      property_id,
      room_id, // Optional - if provided, this is a room lease
      tenant_id,
      start_date,
      number_of_months,
      payment_day,
      monthly_rent,
      // Reminders
      is_expiry_reminder,
      expiry_days_before_reminder,
      is_rent_reminder,
      rent_reminder_days_before,
      is_overdue_rent_reminder,
      overdue_days_after_reminder,
      // Initial charges payment
      initial_charges,
      is_paid,
      payment_method,
      payment_date,
      payment_time,
      receipt_image,
      // Late payment charges
      late_charges
    } = body

    const requiredFields = [
      [property_id, 'Property ID'],
      [tenant_id, 'Tenant ID'],
      [start_date, 'Start date'],
      [payment_day, 'Payment day'],
      [initial_charges?.length, 'At least one initial charge'],
      [payment_date && payment_time, 'Payment date and time']
    ] as const

    for (const [value, name] of requiredFields) {
      if (!value) {
        return NextResponse.json(
          { error: `${name} is required` },
          { status: 400 }
        )
      }
    }

    // Authorization checks - verify property and tenant belong to the organization
    // Note: Existence checks are handled by database foreign key constraints
    // Lease conflict checks are handled by database trigger (validate_lease_insert)
    const [property, organizationTenant] = await Promise.all([
      prisma.properties.findFirst({
        where: {
          id: property_id,
          organization_id: staff.organization_id
        },
        select: { id: true }
      }),
      prisma.organizations_tenants.findFirst({
        where: {
          tenant_id: tenant_id,
          organization_id: staff.organization_id
        }
      })
    ])

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    if (!organizationTenant) {
      return NextResponse.json(
        { error: 'Tenant not found in organization' },
        { status: 404 }
      )
    }

    // Combine payment date and time
    const paymentDateTime = new Date(`${payment_date}T${payment_time}`)

    // Separate First Month Rental from other initial charges
    const firstMonthRentalCharge = initial_charges.find(
      (charge: any) => charge.type === 'First Month Rental'
    )
    const otherInitialCharges = initial_charges.filter(
      (charge: any) => charge.type !== 'First Month Rental'
    )

    // Calculate total amount from other initial charges (excluding First Month Rental)
    const initialChargesTotalAmount = otherInitialCharges.reduce(
      (sum: number, charge: any) => {
        const amount = parseFloat(charge.amount) || 0
        const tax = charge.isTaxableChecked ? amount * 0.08 : 0
        return sum + amount + tax
      },
      0
    )

    // Calculate First Month Rental amount
    const firstMonthRentalAmount = firstMonthRentalCharge
      ? parseFloat(firstMonthRentalCharge.amount) || 0
      : 0

    // Determine payment status
    const paymentStatus = is_paid ? 'Paid' : 'Pending'

    // Execute transaction
    const result = await prisma.$transaction(async tx => {
      // ============================================
      // STEP 1: Create Lease
      // ============================================

      // Generate lease reference_id (unique per organization)
      // Format: LS-YYYY-#### (e.g., LS-2025-0001)
      const currentYear = new Date().getFullYear()
      const leaseYearPrefix = `LS-${currentYear}-`

      const latestLease = await tx.leases.findFirst({
        where: {
          organization_id: staff.organization_id,
          reference_id: {
            startsWith: leaseYearPrefix
          }
        },
        orderBy: {
          reference_id: 'desc'
        },
        select: {
          reference_id: true
        }
      })

      let leaseNextSequence = 1
      if (latestLease) {
        const lastSequence = parseInt(latestLease.reference_id.slice(-4))
        leaseNextSequence = lastSequence + 1
      }

      const leaseReferenceId = `${leaseYearPrefix}${leaseNextSequence
        .toString()
        .padStart(4, '0')}`

      const lease = await tx.leases.create({
        data: {
          reference_id: leaseReferenceId,
          start_date: new Date(start_date),
          number_of_months: number_of_months || null,
          payment_day: payment_day,
          monthly_rent: monthly_rent || 0,
          status: 'Current',
          // Reminders
          is_expiry_reminder: is_expiry_reminder || false,
          expiry_days_before_reminder: expiry_days_before_reminder || null,
          is_rent_reminder: is_rent_reminder || false,
          rent_reminder_days_before: rent_reminder_days_before || null,
          is_overdue_rent_reminder: is_overdue_rent_reminder || false,
          overdue_days_after_reminder: overdue_days_after_reminder || null,
          // Relations
          property_id: property_id,
          room_id: room_id || null, // null for property leases, set for room leases
          tenant_id: tenant_id,
          organization_id: staff.organization_id,
          created_by: staff.id
        }
      })

      // ============================================
      // STEP 2: Create Initial Charges Payment (excluding First Month Rental)
      // ============================================

      // Helper function to generate next payment reference_id
      const generatePaymentReferenceId = async (
        currentSequence: number
      ): Promise<string> => {
        return `${paymentYearPrefix}${currentSequence
          .toString()
          .padStart(8, '0')}`
      }

      // Generate payment reference_id (unique per organization)
      // Format: PY-YYYY######## (e.g., PY-202500000001)
      const paymentYearPrefix = `PY-${currentYear}`

      const latestPayment = await tx.payments.findFirst({
        where: {
          organization_id: staff.organization_id,
          reference_id: {
            startsWith: paymentYearPrefix
          }
        },
        orderBy: {
          reference_id: 'desc'
        },
        select: {
          reference_id: true
        }
      })

      let paymentNextSequence = 1
      if (latestPayment) {
        const lastSequence = parseInt(latestPayment.reference_id.slice(-8))
        paymentNextSequence = lastSequence + 1
      }

      let initialChargesPayment = null

      // Only create initial charges payment if there are other charges besides First Month Rental
      if (otherInitialCharges.length > 0) {
        const initialChargesReferenceId = await generatePaymentReferenceId(
          paymentNextSequence
        )
        paymentNextSequence++

        initialChargesPayment = await tx.payments.create({
          data: {
            reference_id: initialChargesReferenceId,
            lease_id: lease.id,
            type: 'Lease_Initial_Charges',
            status: paymentStatus,
            due_payment_timestamp: is_paid ? null : paymentDateTime,
            organization_id: staff.organization_id,
            created_by: staff.id,
            charges: {
              create: otherInitialCharges.map((charge: any) => ({
                title: charge.type,
                amount: parseFloat(charge.amount) || 0,
                is_taxed: charge.isTaxableChecked || false,
                is_refunded: charge.isRefundableChecked || false,
                created_by: staff.id
              }))
            }
          }
        })

        // If paid, create payment_history entry for initial charges
        if (is_paid) {
          await tx.payment_history.create({
            data: {
              payment_id: initialChargesPayment.id,
              amount: initialChargesTotalAmount,
              payment_method:
                payment_method === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
              paid_at: paymentDateTime,
              registrar_role: 'staff',
              registrar: staff.id,
              receipt_image: receipt_image || null,
              status: 'Success'
            }
          })
        }
      }

      // ============================================
      // STEP 3: Create First Month Rental Payment (type: Rental)
      // ============================================

      let firstMonthRentalPayment = null

      if (firstMonthRentalCharge) {
        const firstMonthRentalReferenceId = await generatePaymentReferenceId(
          paymentNextSequence
        )
        paymentNextSequence++

        firstMonthRentalPayment = await tx.payments.create({
          data: {
            reference_id: firstMonthRentalReferenceId,
            lease_id: lease.id,
            type: 'Rental',
            status: paymentStatus,
            due_payment_timestamp: is_paid ? null : paymentDateTime,
            organization_id: staff.organization_id,
            created_by: staff.id,
            charges: {
              create: {
                title: 'Monthly Rental',
                amount: firstMonthRentalAmount,
                is_taxed: false,
                is_refunded: firstMonthRentalCharge?.isRefundableChecked || false,
                created_by: staff.id
              }
            }
          }
        })

        // If paid, create payment_history entry for first month rental
        if (is_paid) {
          await tx.payment_history.create({
            data: {
              payment_id: firstMonthRentalPayment.id,
              amount: firstMonthRentalAmount,
              payment_method:
                payment_method === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
              paid_at: paymentDateTime,
              registrar_role: 'staff',
              registrar: staff.id,
              receipt_image: receipt_image || null,
              status: 'Success'
            }
          })

          // ============================================
          // STEP 4: Create Next Month Rental Payment (if First Month is Paid)
          // ============================================

          // Calculate next month due date based on payment_day
          // Similar logic to the trigger: month after current payment, using lease's payment_day
          const firstMonthDueDate = paymentDateTime
          const nextMonthDueDate = new Date(firstMonthDueDate)
          nextMonthDueDate.setMonth(nextMonthDueDate.getMonth() + 1)
          nextMonthDueDate.setDate(payment_day)
          // Set time to start of day
          nextMonthDueDate.setHours(0, 0, 0, 0)

          const nextMonthRentalReferenceId = await generatePaymentReferenceId(
            paymentNextSequence
          )

          await tx.payments.create({
            data: {
              reference_id: nextMonthRentalReferenceId,
              lease_id: lease.id,
              type: 'Rental',
              status: 'Pending',
              due_payment_timestamp: nextMonthDueDate,
              organization_id: staff.organization_id,
              created_by: staff.id,
              charges: {
                create: {
                  title: 'Monthly Rental',
                  amount: monthly_rent || 0,
                  is_taxed: false,
                  is_refunded: false,
                  created_by: staff.id
                }
              }
            }
          })
        }
      }

      // ============================================
      // STEP 3: Create Late Payment Charges
      // ============================================

      if (late_charges && late_charges.length > 0) {
        await tx.late_payment_charges.createMany({
          data: late_charges.map((charge: any) => ({
            lease_id: lease.id,
            days_after_due: charge.days_after_due,
            amount: parseFloat(charge.amount) || 0,
            created_by: staff.id
          }))
        })
      }

      return {
        lease,
        initialChargesPayment,
        firstMonthRentalPayment
      }
    }, { timeout: 10000 })

    return NextResponse.json(
      {
        success: true,
        lease_id: result.lease.id,
        lease_reference_id: result.lease.reference_id,
        initial_charges_payment_id: result.initialChargesPayment?.id || null,
        initial_charges_payment_reference_id:
          result.initialChargesPayment?.reference_id || null,
        first_month_rental_payment_id:
          result.firstMonthRentalPayment?.id || null,
        first_month_rental_payment_reference_id:
          result.firstMonthRentalPayment?.reference_id || null,
        message: 'Lease created successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating lease:', error)

    // Check for transaction timeout (P2028 = transaction expired)
    if (error.code === 'P2028') {
      return NextResponse.json(
        { error: 'The server is taking too long to respond. Please try again' },
        { status: 408 }
      )
    }

    // Check for lease conflict errors from database trigger
    const conflictError = parseLeaseConflictError(error.message)
    if (conflictError) {
      return NextResponse.json({ error: conflictError }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to create lease' },
      { status: 500 }
    )
  }
}
