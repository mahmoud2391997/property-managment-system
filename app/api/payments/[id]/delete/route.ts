'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { getBillWithTransaction } from '@/lib/billplz'

/**
 * Delete a payment - Staff only
 * Only allowed if no successful payments exist
 * Checks Billplz for any pending payments that might have been completed
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff can delete payments
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Only staff can delete payments' },
        { status: 403 }
      )
    }

    const { id: reference_id } = await params

    // Find the payment by reference_id and verify it belongs to staff's organization
    const payment = await prisma.payments.findFirst({
      where: {
        reference_id: reference_id,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        reference_id: true,
        payment_history: {
          select: {
            id: true,
            status: true,
            billplz_bill_id: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or access denied' },
        { status: 404 }
      )
    }

    // Check if any successful payment exists
    const hasSuccessfulPayment = payment.payment_history.some(
      h => h.status === 'Success'
    )

    if (hasSuccessfulPayment) {
      return NextResponse.json(
        {
          error: 'Cannot delete payment with successful payment history',
          has_successful_payment: true
        },
        { status: 400 }
      )
    }

    // Check pending payments against Billplz
    const pendingPayments = payment.payment_history.filter(
      h => h.status === 'Pending' && h.billplz_bill_id
    )

    for (const pending of pendingPayments) {
      if (pending.billplz_bill_id) {
        try {
          const billDetails = await getBillWithTransaction(pending.billplz_bill_id)

          // If bill is paid in Billplz, prevent deletion
          if (billDetails.paid && billDetails.state === 'paid') {
            return NextResponse.json(
              {
                error: 'Cannot delete - a payment was completed',
                payment_completed_externally: true,
                message: 'A payment has been completed through the payment gateway. This payment cannot be deleted.'
              },
              { status: 400 }
            )
          }
        } catch (billError) {
          console.error('Error checking Billplz bill:', billError)
          // Continue checking other bills if one fails
        }
      }
    }

    // Safe to delete - first delete payment history, then the payment
    await prisma.payment_history.deleteMany({
      where: { payment_id: payment.id }
    })

    // Delete associated charges
    await prisma.charges.deleteMany({
      where: { payment_id: payment.id }
    })

    // Delete the payment
    await prisma.payments.delete({
      where: { id: payment.id }
    })

    console.log(`Payment deleted: ${payment.reference_id} by staff ${staff.id}`)

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}
