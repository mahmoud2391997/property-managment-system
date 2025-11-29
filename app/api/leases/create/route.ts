import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function POST(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const body = await request.json()
    const {
      property_id,
      tenant_id,
      start_date,
      number_of_months,
      leave_day,
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

    // Validation
    if (!property_id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    if (!start_date) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    if (!payment_day) {
      return NextResponse.json(
        { error: 'Payment day is required' },
        { status: 400 }
      )
    }

    if (!initial_charges || initial_charges.length === 0) {
      return NextResponse.json(
        { error: 'At least one initial charge is required' },
        { status: 400 }
      )
    }

    if (!payment_date || !payment_time) {
      return NextResponse.json(
        { error: 'Payment date and time are required' },
        { status: 400 }
      )
    }

    // Verify property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: property_id,
        organization_id: staff.organization_id
      },
      select: { id: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Verify tenant belongs to the organization
    const organizationTenant = await prisma.organizations_tenants.findFirst({
      where: {
        tenant_id: tenant_id,
        organization_id: staff.organization_id
      }
    })

    if (!organizationTenant) {
      return NextResponse.json(
        { error: 'Tenant not found in organization' },
        { status: 404 }
      )
    }

    // Combine payment date and time
    const paymentDateTime = new Date(`${payment_date}T${payment_time}`)

    // Calculate total amount from initial charges
    const totalAmount = initial_charges.reduce((sum: number, charge: any) => {
      const amount = parseFloat(charge.amount) || 0
      const tax = charge.isTaxableChecked ? amount * 0.08 : 0
      return sum + amount + tax
    }, 0)

    // Determine payment status
    const paymentStatus = is_paid ? 'Paid' : 'Pending'

    // Execute 3-step transaction
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

      const leaseReferenceId = `${leaseYearPrefix}${leaseNextSequence.toString().padStart(4, '0')}`

      const lease = await tx.leases.create({
        data: {
          reference_id: leaseReferenceId,
          start_date: new Date(start_date),
          number_of_months: number_of_months || null,
          leave_day: leave_day || null,
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
          tenant_id: tenant_id,
          organization_id: staff.organization_id,
          created_by: staff.id
        }
      })

      // ============================================
      // STEP 2: Create Payment with Charges
      // ============================================

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

      const paymentReferenceId = `${paymentYearPrefix}${paymentNextSequence.toString().padStart(8, '0')}`

      // Create payment with charges
      const payment = await tx.payments.create({
        data: {
          reference_id: paymentReferenceId,
          lease_id: lease.id,
          type: 'Lease_Initial_Charges',
          status: paymentStatus,
          due_payment_timestamp: is_paid ? null : paymentDateTime,
          organization_id: staff.organization_id,
          created_by: staff.id,
          charges: {
            create: initial_charges.map((charge: any) => ({
              title: charge.type,
              amount: parseFloat(charge.amount) || 0,
              is_taxed: charge.isTaxableChecked || false,
              is_refunded: false,
              created_by: staff.id
            }))
          }
        }
      })

      // If paid, create payment_history entry
      if (is_paid) {
        await tx.payment_history.create({
          data: {
            payment_id: payment.id,
            amount: totalAmount,
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
        payment
      }
    })

    return NextResponse.json(
      {
        success: true,
        lease_id: result.lease.id,
        lease_reference_id: result.lease.reference_id,
        payment_id: result.payment.id,
        payment_reference_id: result.payment.reference_id,
        message: 'Lease created successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating lease:', error)
    return NextResponse.json(
      { error: 'Failed to create lease' },
      { status: 500 }
    )
  }
}
