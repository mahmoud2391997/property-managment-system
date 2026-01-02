'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { parseLocalDateTime } from '@/utils/formatTime'

/**
 * Log a manual payment (Cash or Bank Transfer) - Staff only
 * This is for payments made outside the app
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff can log manual payments
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Only staff can log manual payments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      payment_id, // This is the reference_id (e.g., "P001"), not UUID
      amount,
      payment_method,
      payment_date,
      payment_time,
      receipt_image
    } = body

    // Validate required fields
    if (!payment_id || !amount || !payment_method || !payment_date || !payment_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate payment method
    if (!['Cash', 'Bank Transfer'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Must be Cash or Bank Transfer' },
        { status: 400 }
      )
    }

    // Convert payment method to Prisma enum value
    const prismaPaymentMethod = payment_method === 'Bank Transfer' ? 'Bank_Transfer' : payment_method

    // Validate amount
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Find the payment by reference_id and verify it belongs to staff's organization
    const payment = await prisma.payments.findFirst({
      where: {
        reference_id: payment_id,
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

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate total amount for the payment
    const totalAmount = payment.charges.reduce((sum, charge) => {
      const chargeAmount = charge.amount.toNumber()
      const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
      return sum + chargeAmount + tax
    }, 0)

    // Get existing successful payments
    const existingHistory = await prisma.payment_history.findMany({
      where: {
        payment_id: payment.id,
        status: 'Success'
      },
      select: { amount: true }
    })

    const totalPaid = existingHistory.reduce((sum, h) => sum + h.amount.toNumber(), 0)
    const remainingAmount = totalAmount - totalPaid

    // Validate amount doesn't exceed remaining
    if (numAmount > remainingAmount + 0.01) { // Small tolerance for floating point
      return NextResponse.json(
        { error: `Amount exceeds remaining balance of RM ${remainingAmount.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Parse payment date and time using utility that preserves local timezone
    const paymentDateTime = parseLocalDateTime(payment_date, payment_time)

    // Validate date is not in the future
    if (paymentDateTime > new Date()) {
      return NextResponse.json(
        { error: 'Payment date and time cannot be in the future' },
        { status: 400 }
      )
    }

    // Create payment history record
    const paymentHistory = await prisma.payment_history.create({
      data: {
        payment_id: payment.id,
        amount: numAmount,
        payment_method: prismaPaymentMethod,
        paid_at: paymentDateTime,
        status: 'Success',
        receipt_image: receipt_image || null,
        registrar_role: 'staff',
        registrar: staff.id,
        billplz_bill_id: null,
        billplz_transaction_id: null
      }
    })

    // Calculate new payment percentage
    const newTotalPaid = totalPaid + numAmount
    const paymentPercentage = Math.min(
      Math.round((newTotalPaid / totalAmount) * 100),
      100
    )

    // Update payment status if fully paid
    if (paymentPercentage >= 100) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'Paid' }
      })
    }

    console.log(`Manual payment logged: ${payment.reference_id} - RM ${numAmount} via ${payment_method}`)

    return NextResponse.json({
      success: true,
      message: 'Payment logged successfully',
      payment_history_id: paymentHistory.id,
      amount_paid: numAmount,
      payment_percentage: paymentPercentage
    })
  } catch (error: any) {
    console.error('Error logging payment:', error)
    return NextResponse.json(
      { error: 'Failed to log payment' },
      { status: 500 }
    )
  }
}
