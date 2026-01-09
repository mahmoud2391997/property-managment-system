import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyXSignature, getBill, getBillTransactions, BillplzWebhookPayload } from '@/lib/billplz'
import { handleRecurringPaymentGeneration } from '@/lib/recurring-payments-utils'

/**
 * Test endpoint to verify webhook URL is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Billplz webhook endpoint is reachable',
    timestamp: new Date().toISOString()
  })
}

/**
 * Webhook handler for Billplz payment callbacks
 * This endpoint is called by Billplz when a payment is completed or failed
 */
export async function POST(request: NextRequest) {
  // Log immediately to confirm webhook arrival
  console.log('====================================')
  console.log('🔔 WEBHOOK RECEIVED AT:', new Date().toISOString())
  console.log('====================================')

  try {
    // Parse form data from Billplz
    const formData = await request.formData()
    const payload: BillplzWebhookPayload = {
      id: formData.get('id') as string,
      collection_id: formData.get('collection_id') as string,
      paid: formData.get('paid') === 'true',
      state: formData.get('state') as string,
      amount: formData.get('amount') as string,
      paid_amount: formData.get('paid_amount') as string,
      due_at: formData.get('due_at') as string,
      email: formData.get('email') as string,
      mobile: formData.get('mobile') as string | null,
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      paid_at: formData.get('paid_at') as string,
      x_signature: formData.get('x_signature') as string
    }

    // Add any additional fields from form data
    for (const [key, value] of formData.entries()) {
      if (!(key in payload)) {
        payload[key] = value as string
      }
    }

    // Log ALL received data for debugging
    console.log('📦 Payload received:')
    console.log(JSON.stringify(payload, null, 2))

    // SECURITY: Verify X Signature to ensure request is from Billplz
    console.log('🔐 Verifying X-Signature...')
    const isValidSignature = verifyXSignature(payload)

    if (!isValidSignature) {
      console.error('❌ Invalid X Signature - possible fraudulent request')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log('✅ X-Signature validated successfully!')

    // Log all received data for debugging
    console.log('=== Billplz Webhook Received ===')
    console.log('All form data keys:', Array.from(formData.keys()))

    // Extract payment information from payload
    const billId = payload.id
    const isPaid = payload.paid
    const state = payload.state
    const paidAmount = parseFloat(payload.paid_amount) / 100 // Convert cents to RM
    const transactionId = formData.get('transaction_id') as string | null
    const paymentReference = formData.get('reference_1') as string // reference_id
    const paymentId = formData.get('reference_2') as string // payment.id

    console.log('Extracted values:')
    console.log('- billId:', billId)
    console.log('- reference_1:', paymentReference)
    console.log('- reference_2:', paymentId)
    console.log('================================')

    // Billplz doesn't send reference fields in webhook, fetch from API
    let finalPaymentReference = paymentReference
    let finalPaymentId = paymentId

    if (!paymentReference || !paymentId) {
      console.log('Fetching bill details from Billplz API...')
      const billDetails = await getBill(billId)
      finalPaymentReference = billDetails.reference_1
      finalPaymentId = billDetails.reference_2
      console.log('Fetched from API - reference_1:', finalPaymentReference, 'reference_2:', finalPaymentId)
    }

    if (!finalPaymentReference || !finalPaymentId) {
      console.error('Missing payment reference even after fetching from Billplz API')
      return NextResponse.json(
        { error: 'Missing payment reference' },
        { status: 400 }
      )
    }

    // Find the payment in database
    const payment = await prisma.payments.findUnique({
      where: { id: finalPaymentId },
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
    })

    if (!payment) {
      console.error(`Payment not found: ${finalPaymentId}`)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify reference_id matches
    if (payment.reference_id !== finalPaymentReference) {
      console.error('Payment reference mismatch')
      return NextResponse.json(
        { error: 'Payment reference mismatch' },
        { status: 400 }
      )
    }

    // Check if payment record(s) exist (should exist as Pending from create-bill or create-group-bill)
    const existingHistoryRecords = await prisma.payment_history.findMany({
      where: {
        billplz_bill_id: billId
      }
    })

    if (existingHistoryRecords.length === 0) {
      console.error('No payment history found for this bill')
      return NextResponse.json(
        { error: 'Payment history not found' },
        { status: 404 }
      )
    }

    // Check if this is a group payment
    const isGroupPayment = existingHistoryRecords[0]?.group_payment || false

    // If already marked as Success, skip duplicate processing
    if (existingHistoryRecords.every(record => record.status === 'Success')) {
      console.log('Duplicate webhook callback detected - payment(s) already recorded')
      return NextResponse.json({
        success: true,
        message: 'Payment(s) already recorded'
      })
    }

    // Handle different Billplz states
    // 'paid' = Payment successful
    // 'due' = Payment not completed yet (pending)
    // 'failed' or others = Payment attempted but failed

    // Case 1: Payment is marked as 'paid' in Billplz
    if (isPaid && state === 'paid') {
      // Try to get transaction_id - first from webhook, then from API
      let finalTransactionId = transactionId

      // If transaction_id not in webhook, fetch from transactions endpoint
      if (!finalTransactionId) {
        console.log('⚠️ No transaction_id in webhook, fetching from transactions endpoint...')
        try {
          const transactionsData = await getBillTransactions(billId)
          const completedTransaction = transactionsData.transactions.find(
            t => t.status === 'completed'
          )
          if (completedTransaction) {
            finalTransactionId = completedTransaction.id
            console.log(`✅ Found transaction_id from API: ${finalTransactionId}`)
          }
        } catch (error) {
          console.error('Error fetching transactions:', error)
        }
      }

      // SECURITY: Verify transaction ID exists for legitimate payment
      // If payment is marked as paid but no transaction ID, mark ALL as Failed
      if (!finalTransactionId) {
        console.error('⚠️ Payment marked as paid but no transaction_id available - marking as Failed')

        await prisma.payment_history.updateMany({
          where: { billplz_bill_id: billId },
          data: {
            status: 'Failed',
            paid_at: new Date()
          }
        })

        return NextResponse.json({
          success: false,
          message: 'Payment failed - no transaction ID'
        }, { status: 400 })
      }

      // Update ALL payment_history records with this billplz_bill_id to Success
      await prisma.payment_history.updateMany({
        where: { billplz_bill_id: billId },
        data: {
          status: 'Success',
          paid_at: new Date(payload.paid_at),
          billplz_transaction_id: finalTransactionId
        }
      })

      // Process each payment to update status and generate recurring payments
      const processedPayments = []
      let totalRecurringGenerated = 0

      for (const historyRecord of existingHistoryRecords) {
        const payment = await prisma.payments.findUnique({
          where: { id: historyRecord.payment_id! },
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
        })

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
          payment_percentage: paymentPercentage
        })
      }

      console.log(`${isGroupPayment ? 'Group payment' : 'Payment'} processed successfully: ${processedPayments.length} payment(s)`)

      return NextResponse.json({
        success: true,
        message: `${isGroupPayment ? 'Group payment' : 'Payment'} processed successfully`,
        is_group_payment: isGroupPayment,
        payment_count: processedPayments.length,
        amount_paid: paidAmount,
        processed_payments: processedPayments,
        recurring_payments_generated: totalRecurringGenerated
      })
    }
    // Case 2: Payment state is 'due' (pending, not completed yet)
    else if (state === 'due') {
      console.log(`Payment still pending: ${billId} - State: ${state}`)

      return NextResponse.json({
        success: true,
        message: 'Webhook received - payment still pending',
        state: state
      })
    }
    // Case 3: Payment state is 'failed' or any other failure state
    else {
      console.log(`Payment failed: ${billId} - State: ${state}`)

      // Mark ALL pending payment_history records as Failed
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
        success: true,
        message: 'Webhook received - payment(s) failed',
        is_group_payment: isGroupPayment,
        payment_count: existingHistoryRecords.length,
        state: state
      })
    }
  } catch (error: any) {
    console.error('Error processing Billplz webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
