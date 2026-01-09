'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { getBillWithTransaction } from '@/lib/billplz'
import { handleRecurringPaymentGeneration } from '@/lib/recurring-payments-utils'

/**
 * Check group payment status by fetching bill details from Billplz API
 * This is a fallback for when webhooks are delayed or fail
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only tenants can check group payment status
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Only tenants can access this endpoint' }, { status: 403 })
    }

    // Find the most recent group payment bill for this tenant
    const groupPaymentHistory = await prisma.payment_history.findFirst({
      where: {
        payments: {
          leases: {
            tenant_id: tenant.id
          }
        },
        billplz_bill_id: { not: null },
        group_payment: true
      },
      select: {
        billplz_bill_id: true,
        status: true
      },
      orderBy: {
        paid_at: 'desc'
      }
    })

    if (!groupPaymentHistory || !groupPaymentHistory.billplz_bill_id) {
      return NextResponse.json({
        success: false,
        no_payment_made: true,
        message: 'No group payment has been made yet.'
      })
    }

    const billId = groupPaymentHistory.billplz_bill_id

    // Get all payment_history records with this bill_id
    const allHistoryRecords = await prisma.payment_history.findMany({
      where: {
        billplz_bill_id: billId
      },
      include: {
        payments: {
          select: {
            id: true,
            reference_id: true,
            organization_id: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
              }
            }
          }
        }
      }
    })

    if (allHistoryRecords.length === 0) {
      return NextResponse.json(
        { error: 'Payment history not found' },
        { status: 404 }
      )
    }

    // If already marked as Success, return early
    if (allHistoryRecords.every(record => record.status === 'Success')) {
      const processedPayments = allHistoryRecords.map(record => ({
        payment_id: record.payments?.reference_id,
        amount_paid: record.amount.toNumber()
      }))

      return NextResponse.json({
        success: true,
        already_recorded: true,
        message: 'Group payment already recorded',
        is_group_payment: true,
        payment_count: processedPayments.length,
        processed_payments: processedPayments
      })
    }

    // Fetch bill details from Billplz
    const billDetails = await getBillWithTransaction(billId)

    // Handle different Billplz states
    // Case 1: Payment state is 'due' (pending, not completed yet)
    if (billDetails.state === 'due') {
      return NextResponse.json({
        success: false,
        payment_not_completed: true,
        message: 'Group payment not completed yet. Please complete your payment.'
      })
    }

    // Case 2: Payment state is 'failed' or any other failure state
    if (billDetails.state !== 'paid' || !billDetails.paid) {
      // Mark ALL as Failed in database if pending
      await prisma.payment_history.updateMany({
        where: {
          billplz_bill_id: billId,
          status: 'Pending'
        },
        data: {
          status: 'Failed',
          paid_at: new Date()
        }
      })

      return NextResponse.json({
        success: false,
        payment_failed: true,
        message: 'Group payment failed due to an issue with the payment gateway. Please try again.'
      })
    }

    // Case 3: Payment is marked as 'paid' in Billplz
    // SECURITY: Verify transaction ID exists for legitimate payment
    if (!billDetails.transaction_id) {
      console.error('⚠️ Group payment marked as paid but no transaction_id from Billplz API - marking as Failed')

      await prisma.payment_history.updateMany({
        where: { billplz_bill_id: billId },
        data: {
          status: 'Failed',
          paid_at: new Date()
        }
      })

      return NextResponse.json({
        success: false,
        payment_failed: true,
        message: 'Payment verification failed. Please contact support.'
      })
    }

    // Update ALL payment_history records with this billplz_bill_id to Success
    await prisma.payment_history.updateMany({
      where: { billplz_bill_id: billId },
      data: {
        status: 'Success',
        paid_at: new Date(),
        billplz_transaction_id: billDetails.transaction_id
      }
    })

    // Process each payment to update status and generate recurring payments
    const processedPayments = []
    let totalRecurringGenerated = 0

    for (const historyRecord of allHistoryRecords) {
      const payment = historyRecord.payments

      if (!payment) continue

      // Calculate total amount for this payment
      const totalAmount = payment.charges.reduce((sum, charge) => {
        const amount = charge.amount.toNumber()
        const tax = charge.is_taxed ? amount * 0.08 : 0
        return sum + amount + tax
      }, 0)

      // Get all previous SUCCESSFUL payments for this payment
      const previousPayments = await prisma.payment_history.findMany({
        where: {
          payment_id: payment.id,
          status: 'Success'
        },
        select: { amount: true }
      })

      const totalPaid = previousPayments.reduce(
        (sum, h) => sum + h.amount.toNumber(),
        0
      )

      const paymentPercentage = Math.min(
        Math.round((totalPaid / totalAmount) * 100),
        100
      )

      // Update payment status if fully paid
      if (paymentPercentage >= 100) {
        await prisma.payments.update({
          where: { id: payment.id },
          data: { status: 'Paid' }
        })

        // Generate recurring payment if applicable
        try {
          await handleRecurringPaymentGeneration(payment.id, payment.organization_id)
          totalRecurringGenerated++
        } catch (recurringError) {
          console.error(`Error generating recurring payment for ${payment.id}:`, recurringError)
        }
      }

      processedPayments.push({
        payment_id: payment.reference_id,
        amount_paid: historyRecord.amount.toNumber(),
        payment_percentage: paymentPercentage
      })
    }

    console.log(`Group payment status checked and recorded: ${processedPayments.length} payment(s)`)

    return NextResponse.json({
      success: true,
      message: 'Group payment verified and recorded',
      newly_recorded: true,
      is_group_payment: true,
      payment_count: processedPayments.length,
      processed_payments: processedPayments,
      recurring_payments_generated: totalRecurringGenerated
    })
  } catch (error: any) {
    console.error('Error checking group payment status:', error)
    return NextResponse.json(
      { error: 'Failed to check group payment status' },
      { status: 500 }
    )
  }
}
