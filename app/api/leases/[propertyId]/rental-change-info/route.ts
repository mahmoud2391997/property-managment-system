'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { propertyId: leaseId } = await params

    // Get lease with current rent and payment day
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id,
        status: 'Current'
      },
      select: {
        id: true,
        monthly_rent: true,
        payment_day: true,
        property_id: true,
        room_id: true
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found or not active' },
        { status: 404 }
      )
    }

    // Get pending rental payment (if any)
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
          select: { amount: true, is_taxed: true }
        }
      },
      orderBy: { due_payment_timestamp: 'asc' }
    })

    // Calculate total amount and total paid for pending payment
    let pendingPaymentInfo = null
    if (pendingPayment) {
      const totalAmount = pendingPayment.charges.reduce((sum, charge) => {
        const amount = Number(charge.amount)
        return sum + (charge.is_taxed ? amount * 1.08 : amount)
      }, 0)

      const totalPaid = pendingPayment.payment_history.reduce(
        (sum, h) => sum + Number(h.amount),
        0
      )

      pendingPaymentInfo = {
        id: pendingPayment.id,
        dueDate: pendingPayment.due_payment_timestamp,
        totalAmount: totalAmount,
        totalPaid: totalPaid
      }
    }

    // Check for existing scheduled change
    const existingScheduledChange =
      await prisma.scheduled_rental_changes.findFirst({
        where: {
          lease_id: leaseId,
          status: 'Scheduled'
        },
        select: {
          id: true,
          new_monthly_rent: true,
          effective_from: true
        }
      })

    return NextResponse.json({
      currentRent: Number(lease.monthly_rent),
      paymentDay: lease.payment_day,
      propertyId: lease.property_id,
      roomId: lease.room_id,
      pendingPayment: pendingPaymentInfo,
      existingScheduledChange: existingScheduledChange
        ? {
            id: existingScheduledChange.id,
            newRent: Number(existingScheduledChange.new_monthly_rent),
            effectiveFrom: existingScheduledChange.effective_from
          }
        : null
    })
  } catch (error: any) {
    console.error('Error fetching rental change info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rental change info' },
      { status: 500 }
    )
  }
}
