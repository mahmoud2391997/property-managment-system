'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { getBillWithTransaction } from '@/lib/billplz'
import { handleRecurringPaymentGeneration } from '@/lib/recurring-payments-utils'

/**
 * Check payment status by fetching bill details from Billplz API
 * This is a fallback for when webhooks are delayed or fail
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { payment_id, bill_id, reference_id } = body

    // Accept either (payment_id + bill_id) OR just reference_id
    if (!reference_id && (!payment_id || !bill_id)) {
      return NextResponse.json(
        { error: 'Either reference_id OR (payment_id + bill_id) required' },
        { status: 400 }
      )
    }

    // Verify user has access to this payment
    // For staff: check organization
    // For tenant: check if payment belongs to their lease
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!staff && !tenant) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let actualPaymentId = payment_id
    let actualBillId = bill_id

    // If reference_id is provided, find the payment and bill (both pending and completed)
    if (reference_id) {
      const payment = staff
        ? await prisma.payments.findFirst({
            where: {
              reference_id: reference_id,
              organization_id: staff.organization_id
            },
            select: {
              id: true,
              payment_history: {
                where: {
                  billplz_bill_id: { not: null }
                },
                select: {
                  billplz_bill_id: true,
                  status: true
                },
                orderBy: {
                  paid_at: 'desc'
                },
                take: 1
              }
            }
          })
        : await prisma.payments.findFirst({
            where: {
              reference_id: reference_id,
              leases: {
                tenant_id: tenant!.id
              }
            },
            select: {
              id: true,
              payment_history: {
                where: {
                  billplz_bill_id: { not: null }
                },
                select: {
                  billplz_bill_id: true,
                  status: true
                },
                orderBy: {
                  paid_at: 'desc'
                },
                take: 1
              }
            }
          })

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment not found or access denied' },
          { status: 404 }
        )
      }

      if (!payment.payment_history[0]?.billplz_bill_id) {
        return NextResponse.json({
          success: false,
          no_payment_made: true,
          message: 'No payment has been made yet for this bill.'
        })
      }

      actualPaymentId = payment.id
      actualBillId = payment.payment_history[0].billplz_bill_id
    }

    // Find and verify payment access
    const payment = staff
      ? await prisma.payments.findFirst({
          where: {
            id: actualPaymentId,
            organization_id: staff.organization_id
          },
          select: {
            id: true,
            reference_id: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
              }
            }
          }
        })
      : await prisma.payments.findFirst({
          where: {
            id: actualPaymentId,
            leases: {
              tenant_id: tenant!.id
            }
          },
          select: {
            id: true,
            reference_id: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
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

    // Fetch bill details from Billplz
    const billDetails = await getBillWithTransaction(actualBillId)

    // Verify bill belongs to this payment
    if (billDetails.reference_2 !== actualPaymentId) {
      return NextResponse.json(
        { error: 'Bill does not belong to this payment' },
        { status: 400 }
      )
    }

    // Check if this payment record exists (should exist as Pending from create-bill)
    const existingHistory = await prisma.payment_history.findFirst({
      where: {
        billplz_bill_id: actualBillId
      }
    })

    // If already marked as Success, return early with updated payment data
    if (existingHistory && existingHistory.status === 'Success') {
      // Calculate payment percentage
      const totalAmount = payment.charges.reduce((sum, charge) => {
        const amount = charge.amount.toNumber()
        const tax = charge.is_taxed ? amount * 0.08 : 0
        return sum + amount + tax
      }, 0)

      const previousPayments = await prisma.payment_history.findMany({
        where: {
          payment_id: actualPaymentId,
          status: 'Success'
        },
        select: { amount: true, paid_at: true },
        orderBy: { paid_at: 'desc' }
      })

      const totalPaid = previousPayments.reduce(
        (sum, h) => sum + h.amount.toNumber(),
        0
      )

      const paymentPercentage = Math.min(
        Math.round((totalPaid / totalAmount) * 100),
        100
      )

      return NextResponse.json({
        success: true,
        already_recorded: true,
        message: 'Payment already recorded',
        payment_history_id: existingHistory.id,
        updated_payment: {
          id: payment.reference_id,
          payment_percentage: paymentPercentage,
          latest_payment_timestamp: previousPayments[0]?.paid_at || new Date(),
          status: paymentPercentage >= 100 ? 'Paid' : 'Partially Paid'
        }
      })
    }

    // Handle different Billplz states
    // 'paid' = Payment successful
    // 'due' = Payment not completed yet (pending)
    // 'failed' or others = Payment attempted but failed

    // Case 1: Payment is marked as 'paid' in Billplz
    if (billDetails.paid && billDetails.state === 'paid') {
      // SECURITY: Verify transaction ID exists for legitimate payment
      // If payment is marked as paid but no transaction ID, mark as Failed
      if (!billDetails.transaction_id) {
        console.error('⚠️ Payment marked as paid but no transaction_id from Billplz API - marking as Failed')

        if (existingHistory) {
          await prisma.payment_history.update({
            where: { id: existingHistory.id },
            data: {
              status: 'Failed',
              paid_at: new Date()
            }
          })
        }

        return NextResponse.json({
          success: false,
          payment_failed: true,
          message: 'Payment verification failed. Please contact support.'
        }, { status: 400 })
      }

      // Payment successful with transaction ID - proceed to record
      // Continue to success flow below
    }
    // Case 2: Payment state is 'due' (pending, not completed yet)
    else if (billDetails.state === 'due') {
      return NextResponse.json({
        success: false,
        payment_not_completed: true,
        message: 'Payment not completed yet. Please complete your payment.'
      })
    }
    // Case 3: Payment state is 'failed' or any other failure state
    else {
      // Mark as Failed in database if pending
      if (existingHistory && existingHistory.status === 'Pending') {
        await prisma.payment_history.update({
          where: { id: existingHistory.id },
          data: {
            status: 'Failed',
            paid_at: new Date()
          }
        })
      }

      return NextResponse.json({
        success: false,
        payment_failed: true,
        message: 'Payment failed due to an issue with the payment gateway. Please try again.'
      }, { status: 400 })
    }

    // Convert paid amount from cents to RM
    const paidAmount = billDetails.paid_amount / 100

    // Calculate total amount
    const totalAmount = payment.charges.reduce((sum, charge) => {
      const amount = charge.amount.toNumber()
      const tax = charge.is_taxed ? amount * 0.08 : 0
      return sum + amount + tax
    }, 0)

    // Get previous SUCCESSFUL payments only
    const previousPayments = await prisma.payment_history.findMany({
      where: {
        payment_id: actualPaymentId,
        status: 'Success'
      },
      select: { amount: true }
    })

    const totalPreviouslyPaid = previousPayments.reduce(
      (sum, h) => sum + h.amount.toNumber(),
      0
    )

    let paymentHistory

    if (existingHistory) {
      // Update existing pending record to Success
      paymentHistory = await prisma.payment_history.update({
        where: { id: existingHistory.id },
        data: {
          status: 'Success',
          paid_at: new Date(), // Update to actual payment time
          billplz_transaction_id: billDetails.transaction_id
        }
      })
    } else {
      // Create new record if no pending record exists (shouldn't happen normally)
      paymentHistory = await prisma.payment_history.create({
        data: {
          payment_id: actualPaymentId,
          amount: paidAmount,
          payment_method: 'FPX',
          paid_at: new Date(),
          status: 'Success',
          receipt_image: null,
          registrar_role: 'tenant',
          billplz_bill_id: actualBillId,
          billplz_transaction_id: billDetails.transaction_id
        }
      })
    }

    // Calculate new payment percentage
    const newTotalPaid = totalPreviouslyPaid + paidAmount
    const paymentPercentage = Math.min(
      Math.round((newTotalPaid / totalAmount) * 100),
      100
    )

    // Update payment status if fully paid
    if (paymentPercentage >= 100) {
      await prisma.payments.update({
        where: { id: actualPaymentId },
        data: { status: 'Paid' }
      })
    }

    console.log(`Payment status checked and recorded: ${actualPaymentId} - ${paidAmount} RM`)

    // Get the latest payment timestamp for UI update
    const latestPayment = await prisma.payment_history.findFirst({
      where: {
        payment_id: actualPaymentId,
        status: 'Success'
      },
      orderBy: { paid_at: 'desc' },
      select: { paid_at: true }
    })

    // After successful payment, check if this is a recurring payment and generate next one
    let recurringPaymentGenerated = false
    if (paymentPercentage >= 100 && staff) {
      try {
        await handleRecurringPaymentGeneration(actualPaymentId, staff.organization_id)
        recurringPaymentGenerated = true
      } catch (recurringError) {
        // Log error but don't fail the payment check
        console.error('Error generating recurring payment:', recurringError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and recorded',
      payment_history_id: paymentHistory.id,
      amount_paid: paidAmount,
      payment_percentage: paymentPercentage,
      newly_recorded: true,
      recurring_payment_generated: recurringPaymentGenerated,
      updated_payment: {
        id: payment.reference_id,
        payment_percentage: paymentPercentage,
        latest_payment_timestamp: latestPayment?.paid_at || new Date(),
        status: paymentPercentage >= 100 ? 'Paid' : 'Partially Paid'
      }
    })
  } catch (error: any) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
