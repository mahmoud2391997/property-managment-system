'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is tenant (this endpoint is tenant-only)
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Only tenants can access this endpoint' }, { status: 403 })
    }

    // Fetch all pending payments for this tenant
    // "Pending" in database means not fully paid and not cancelled
    const pendingPayments = await prisma.payments.findMany({
      where: {
        leases: { tenant_id: tenant.id },
        status: 'Pending' // Database status (not cancelled, not marked as paid)
      },
      select: {
        id: true,
        reference_id: true,
        charges: {
          select: {
            amount: true,
            is_taxed: true
          }
        },
        payment_history: {
          where: {
            status: 'Success' // Only count successful payments
          },
          select: {
            amount: true
          }
        }
      }
    })

    // Calculate remaining amounts for each payment
    const paymentsWithRemaining = pendingPayments.map(payment => {
      // Calculate total amount including tax
      const totalAmount = payment.charges.reduce((sum, charge) => {
        const amount = charge.amount.toNumber()
        const tax = charge.is_taxed ? amount * 0.08 : 0
        return sum + amount + tax
      }, 0)

      // Calculate total paid from successful payment history
      const totalPaid = payment.payment_history.reduce(
        (sum, history) => sum + history.amount.toNumber(),
        0
      )

      // Calculate remaining amount
      const remainingAmount = totalAmount - totalPaid

      return {
        payment_id: payment.id,
        reference_id: payment.reference_id,
        total_amount: totalAmount,
        total_paid: totalPaid,
        remaining_amount: remainingAmount
      }
    })

    // Filter out fully paid payments (remaining <= 0)
    const actuallyPendingPayments = paymentsWithRemaining.filter(
      p => p.remaining_amount > 0
    )

    // Calculate summary
    const totalRemainingAmount = actuallyPendingPayments.reduce(
      (sum, p) => sum + p.remaining_amount,
      0
    )

    // Billplz FPX flat fee per transaction (Plus Plan rate)
    const FPX_FEE_PER_TRANSACTION = 1.20

    // Calculate transaction fee
    // Paying all at once = 1 transaction = RM 1.20
    const transactionFee = FPX_FEE_PER_TRANSACTION

    // Calculate fee savings
    // If paying individually, each payment would incur RM 1.20
    // Paying all at once means one fee instead of multiple fees
    const individualFees = actuallyPendingPayments.length * FPX_FEE_PER_TRANSACTION
    const feeSavings = individualFees - transactionFee // Savings = (n * 1.20) - 1.20

    return NextResponse.json({
      success: true,
      data: {
        payment_count: actuallyPendingPayments.length,
        subtotal: totalRemainingAmount,
        transaction_fee: transactionFee,
        fee_savings: feeSavings,
        total_amount: totalRemainingAmount + transactionFee,
        payments: actuallyPendingPayments
      }
    })
  } catch (error: any) {
    console.error('Error fetching pending payments summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending payments summary' },
      { status: 500 }
    )
  }
}
