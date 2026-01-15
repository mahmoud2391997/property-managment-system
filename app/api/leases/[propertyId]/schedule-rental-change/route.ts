'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { propertyId: leaseId } = await params
    const body = await request.json()
    const {
      newMonthlyRent,
      effectiveMonth, // 0-11
      effectiveYear, // YYYY
      updatePendingPayment // boolean
    } = body

    // ========================================
    // VALIDATION 1: Required fields
    // ========================================
    if (
      newMonthlyRent === undefined ||
      effectiveMonth === undefined ||
      effectiveYear === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newRentAmount = parseFloat(newMonthlyRent)
    if (isNaN(newRentAmount) || newRentAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid rental amount' },
        { status: 400 }
      )
    }

    // ========================================
    // VALIDATION 1b: New rent must be different from current rent
    // ========================================
    // This check will be done after fetching the lease

    // ========================================
    // VALIDATION 2: Lease exists and belongs to organization
    // ========================================
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id,
        status: 'Current'
      },
      include: {
        properties: { select: { id: true, code: true } },
        rooms: { select: { id: true, title: true } },
        tenants: {
          select: {
            id: true,
            individual_tenants: {
              select: { first_name: true, last_name: true }
            },
            company_tenants: { select: { company_name: true } }
          }
        }
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found or not active' },
        { status: 404 }
      )
    }

    // Check if new rent is the same as current rent
    const currentRent = Number(lease.monthly_rent)
    if (Math.abs(newRentAmount - currentRent) < 0.01) {
      return NextResponse.json(
        { error: 'New rental amount must be different from the current amount' },
        { status: 400 }
      )
    }

    // ========================================
    // VALIDATION 3: No existing scheduled change
    // ========================================
    const existingScheduled = await prisma.scheduled_rental_changes.findFirst({
      where: {
        lease_id: leaseId,
        status: 'Scheduled'
      }
    })

    if (existingScheduled) {
      return NextResponse.json(
        { error: 'There is already a scheduled rental change for this lease' },
        { status: 400 }
      )
    }

    // ========================================
    // VALIDATION 4: Effective date is valid future cycle
    // ========================================
    const effectiveDate = new Date(
      effectiveYear,
      effectiveMonth,
      lease.payment_day
    )
    effectiveDate.setHours(0, 0, 0, 0)

    // Get current pending payment to determine "next cycle"
    const pendingPayment = await prisma.payments.findFirst({
      where: {
        lease_id: leaseId,
        type: 'Rental',
        status: 'Pending'
      },
      include: {
        payment_history: {
          where: { status: 'Success' },
          select: { amount: true }
        },
        charges: {
          where: { title: 'Monthly Rental' },
          select: { id: true, amount: true }
        }
      },
      orderBy: { due_payment_timestamp: 'asc' }
    })

    // Calculate next valid cycle (after pending payment's cycle)
    let nextValidCycleDate: Date
    if (pendingPayment?.due_payment_timestamp) {
      const pendingDue = new Date(pendingPayment.due_payment_timestamp)
      nextValidCycleDate = new Date(
        pendingDue.getFullYear(),
        pendingDue.getMonth() + 1,
        lease.payment_day
      )
    } else {
      // No pending payment - next cycle is next month
      const today = new Date()
      nextValidCycleDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        lease.payment_day
      )
    }
    nextValidCycleDate.setHours(0, 0, 0, 0)

    if (effectiveDate < nextValidCycleDate) {
      return NextResponse.json(
        { error: 'Effective date must be a valid future cycle' },
        { status: 400 }
      )
    }

    // Check if selected cycle is the next cycle (for pending payment update logic)
    const isNextCycle =
      effectiveDate.getFullYear() === nextValidCycleDate.getFullYear() &&
      effectiveDate.getMonth() === nextValidCycleDate.getMonth()

    // ========================================
    // VALIDATION 5: If updating pending payment, check constraints
    // ========================================
    if (updatePendingPayment && pendingPayment && isNextCycle) {
      // Calculate amount already paid
      const totalPaid = pendingPayment.payment_history.reduce(
        (sum, h) => sum + Number(h.amount),
        0
      )

      if (totalPaid > 0 && newRentAmount < totalPaid) {
        return NextResponse.json(
          {
            error: `New amount cannot be less than already paid amount (RM ${totalPaid.toFixed(2)})`
          },
          { status: 400 }
        )
      }
    }

    // ========================================
    // EXECUTE TRANSACTION
    // ========================================
    // Determine status: If updating pending payment (immediate change), mark as 'Applied'
    // Otherwise mark as 'Scheduled' so the trigger will apply it later
    const shouldApplyImmediately =
      updatePendingPayment && isNextCycle && pendingPayment && pendingPayment.charges.length > 0

    const result = await prisma.$transaction(async tx => {
      // 1. Create scheduled_rental_changes record
      const scheduledChange = await tx.scheduled_rental_changes.create({
        data: {
          lease_id: leaseId,
          new_monthly_rent: newRentAmount,
          old_monthly_rent: lease.monthly_rent,
          effective_from: effectiveDate,
          status: shouldApplyImmediately ? 'Applied' : 'Scheduled',
          created_by: staff.id
        }
      })

      // 2. If updating pending payment (next cycle selected) - immediate application
      if (shouldApplyImmediately && pendingPayment) {
        // Update the charge amount for the pending payment
        await tx.charges.update({
          where: { id: pendingPayment.charges[0].id },
          data: { amount: newRentAmount }
        })

        // Update lease.monthly_rent so future payments (generated by trigger) use new amount
        await tx.leases.update({
          where: { id: leaseId },
          data: { monthly_rent: newRentAmount }
        })
      }

      // 3. Send notification to tenant
      const tenantUserId = lease.tenants.id

      const oldRent = Number(lease.monthly_rent)
      const percentChange = (((newRentAmount - oldRent) / oldRent) * 100).toFixed(
        1
      )
      const changeDirection = newRentAmount > oldRent ? 'increase' : 'decrease'

      const effectiveDateFormatted = effectiveDate.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      })

      // Redirect tenant to rentals page with reference_id to scroll and highlight
      const pageUrl = `rentals?reference_id=${lease.reference_id}`

      await tx.notifications.create({
        data: {
          organization_id: staff.organization_id,
          user_id: tenantUserId,
          title: 'Rental Amount Change Scheduled',
          message: `Your monthly rent will ${changeDirection} from RM ${oldRent.toFixed(2)} to RM ${newRentAmount.toFixed(2)} (${percentChange}%) effective ${effectiveDateFormatted}.`,
          reference_id: scheduledChange.id,
          reference_type: 'scheduled_rental_change',
          performer_id: null,
          performer_type: 'system',
          page: pageUrl,
          affected_type: 'tenant',
          affected_id: tenantUserId
        }
      })

      return scheduledChange
    })

    return NextResponse.json(
      {
        success: true,
        scheduledChangeId: result.id,
        message: 'Rental change scheduled successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error scheduling rental change:', error)
    return NextResponse.json(
      { error: 'Failed to schedule rental change' },
      { status: 500 }
    )
  }
}
