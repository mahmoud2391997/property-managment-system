'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'leases.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // Note: propertyId is actually leaseId (following existing pattern in this folder)
    const { propertyId: leaseId } = await params

    // Fetch lease with all details needed for transfer
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        reference_id: true,
        monthly_rent: true,
        payment_day: true,
        number_of_months: true,
        start_date: true,
        status: true,
        property_id: true,
        room_id: true,
        // Reminders
        is_expiry_reminder: true,
        expiry_days_before_reminder: true,
        is_rent_reminder: true,
        rent_reminder_days_before: true,
        is_overdue_rent_reminder: true,
        overdue_days_after_reminder: true,
        // Tenant
        tenants: {
          select: {
            id: true,
            type: true,
            profile_thumb: true,
            individual_tenants: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            company_tenants: {
              select: {
                company_name: true,
                contact_person_first_name: true,
                contact_person_last_name: true
              }
            }
          }
        },
        // Property
        properties: {
          select: {
            id: true,
            code: true
          }
        },
        // Room (if room lease)
        rooms: {
          select: {
            id: true,
            title: true
          }
        },
        // Late payment charges for this lease
        late_payment_charges: {
          select: {
            days_after_due: true,
            amount: true
          }
        },
        // Get ALL initial charges payments (charges may be distributed across multiple payments)
        payments: {
          where: {
            type: 'Lease_Initial_Charges'
          },
          select: {
            charges: {
              select: {
                title: true,
                amount: true,
                is_taxed: true,
                is_refunded: true
              }
            }
          }
        }
      }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    // Check if lease can be transferred
    let canTransfer = true
    let blockedReason: string | null = null

    // Check 1: Lease must be Current
    if (lease.status !== 'Current') {
      canTransfer = false
      blockedReason = 'Only current leases can be transferred'
    }

    // Check 2: No active task flow in progress
    if (canTransfer) {
      const existingFlow = await prisma.task_flow_instances.findFirst({
        where: {
          lease_id: leaseId,
          status: 'In Progress'
        }
      })

      if (existingFlow) {
        canTransfer = false
        blockedReason = 'A lease ending flow is already in progress for this lease'
      }
    }

    // Fetch ALL pending payments to check for partially paid (any type)
    const allPendingPayments = await prisma.payments.findMany({
      where: {
        lease_id: leaseId,
        status: 'Pending'
      },
      orderBy: {
        due_payment_timestamp: 'asc'
      },
      select: {
        id: true,
        reference_id: true,
        type: true,
        due_payment_timestamp: true,
        charges: {
          select: {
            amount: true
          }
        },
        // Check for partial payments via payment history
        payment_history: {
          select: {
            amount: true,
            status: true,
            payment_method: true,
            created_at: true
          }
        }
      }
    })

    // Check for pending FPX payments added within the last 30 minutes (still being verified)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const pendingFpxPayment = allPendingPayments.find(payment =>
      payment.payment_history.some(h =>
        h.payment_method === 'FPX' && h.status === 'Pending' && h.created_at && new Date(h.created_at) > thirtyMinutesAgo
      )
    )

    // Check 3: FPX payment currently being verified
    if (canTransfer && pendingFpxPayment) {
      canTransfer = false
      blockedReason = `An FPX payment for ${pendingFpxPayment.type.replace('_', ' ')} (${pendingFpxPayment.reference_id}) is currently being verified. Please wait for the verification to complete before transferring.`
    }

    // Check 4: No partially paid payments (successful amount > 0 but < total charges)
    const partiallyPaidPayment = allPendingPayments.find(payment => {
      const totalCharges = payment.charges.reduce((sum, c) => sum + Number(c.amount), 0)
      const successfulPaid = payment.payment_history
        .filter(h => h.status === 'Success')
        .reduce((sum, h) => sum + Number(h.amount), 0)
      // Partially paid = has some successful payment but less than total
      return successfulPaid > 0 && successfulPaid < totalCharges
    })

    if (canTransfer && partiallyPaidPayment) {
      canTransfer = false
      blockedReason = `There is a partially paid ${partiallyPaidPayment.type.replace('_', ' ')} payment (${partiallyPaidPayment.reference_id}). Please settle it before transferring.`
    }

    // Filter to only rental payments for cycle info
    const pendingRentalPayments = allPendingPayments.filter(p => p.type === 'Rental')

    // Get the next pending rental (earliest due date) for cycle info
    const nextPendingRental = pendingRentalPayments.length > 0 ? pendingRentalPayments[0] : null

    // Fetch PAID rental payments with FUTURE due dates (advance payments)
    // These are rentals the tenant already paid for but the due date hasn't arrived yet
    const paidFutureRentals = await prisma.payments.findMany({
      where: {
        lease_id: leaseId,
        type: 'Rental',
        status: 'Paid',
        due_payment_timestamp: {
          gt: new Date() // Future due dates only
        }
      },
      orderBy: {
        due_payment_timestamp: 'asc'
      },
      select: {
        id: true,
        reference_id: true,
        due_payment_timestamp: true,
        charges: {
          select: {
            amount: true
          }
        }
      }
    })

    // Format tenant name
    const tenant = lease.tenants
    let tenantName: string
    if (tenant.type === 'Company') {
      tenantName = tenant.company_tenants?.company_name || 'Unknown Company'
    } else {
      const individual = tenant.individual_tenants
      tenantName = individual?.last_name
        ? `${individual.first_name} ${individual.last_name}`
        : individual?.first_name || 'Unknown'
    }

    return NextResponse.json({
      lease: {
        id: lease.id,
        reference_id: lease.reference_id,
        monthly_rent: Number(lease.monthly_rent),
        payment_day: lease.payment_day,
        number_of_months: lease.number_of_months,
        start_date: lease.start_date.toISOString(),
        is_property_lease: lease.room_id === null,
        // Reminders
        is_expiry_reminder: lease.is_expiry_reminder,
        expiry_days_before_reminder: lease.expiry_days_before_reminder,
        is_rent_reminder: lease.is_rent_reminder,
        rent_reminder_days_before: lease.rent_reminder_days_before,
        is_overdue_rent_reminder: lease.is_overdue_rent_reminder,
        overdue_days_after_reminder: lease.overdue_days_after_reminder,
        // Tenant
        tenant: {
          id: tenant.id,
          name: tenantName,
          profile_thumb: tenant.profile_thumb
        },
        // Property
        property: {
          id: lease.properties.id,
          code: lease.properties.code
        },
        // Room (if room lease)
        room: lease.rooms ? {
          id: lease.rooms.id,
          title: lease.rooms.title
        } : null,
        // Late charges
        late_charges: lease.late_payment_charges.map(lc => ({
          days_after_due: lc.days_after_due,
          amount: Number(lc.amount)
        })),
        // Initial charges from ALL Lease_Initial_Charges payments (charges distributed across payments)
        initial_charges: lease.payments.flatMap(p =>
          p.charges.map(c => ({
            type: c.title,
            amount: Number(c.amount),
            is_taxed: c.is_taxed,
            is_refundable: c.is_refunded // is_refunded field is used for is_refundable
          }))
        ),
        // Next pending rental payment info (for cycle awareness)
        next_pending_rental: nextPendingRental ? {
          id: nextPendingRental.id,
          reference_id: nextPendingRental.reference_id,
          due_date: nextPendingRental.due_payment_timestamp?.toISOString() || null,
          amount: nextPendingRental.charges.reduce((sum: number, c: { amount: any }) => sum + Number(c.amount), 0)
        } : null,
        // PAID rental payments with FUTURE due dates (advance payments)
        // These are rentals already paid by tenant but due date is in the future
        // Used for rental adjustment calculation when new rent > old rent
        paid_future_rentals: paidFutureRentals.map(p => ({
          id: p.id,
          reference_id: p.reference_id,
          due_date: p.due_payment_timestamp?.toISOString() || null,
          amount: p.charges.reduce((sum: number, c: { amount: any }) => sum + Number(c.amount), 0)
        }))
      },
      can_transfer: canTransfer,
      blocked_reason: blockedReason
    })
  } catch (error) {
    console.error('Error fetching transfer info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfer info' },
      { status: 500 }
    )
  }
}
