'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current staff and organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      expense_reference_id,
      amount,
      payment_method,
      payment_date,
      payment_time,
      receipt_image
    } = body

    // Validate required fields
    if (!expense_reference_id || !amount || !payment_method || !payment_date || !payment_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the expense by reference_id
    const expense = await prisma.expenses.findFirst({
      where: {
        organization_id: staff.organization_id,
        reference_id: expense_reference_id
      },
      select: {
        id: true,
        charges: {
          select: {
            amount: true,
            is_taxed: true
          }
        },
        payment_history: {
          where: {
            status: 'Success'
          },
          select: {
            amount: true
          }
        }
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Calculate total amount and already paid amount
    const totalAmount = expense.charges.reduce((sum, charge) => {
      const chargeAmount = charge.amount.toNumber()
      const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
      return sum + chargeAmount + tax
    }, 0)

    const totalPaid = expense.payment_history.reduce(
      (sum, h) => sum + h.amount.toNumber(),
      0
    )

    const remainingAmount = totalAmount - totalPaid

    // Validate amount doesn't exceed remaining
    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Amount cannot exceed remaining amount of RM ${remainingAmount.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Combine date and time into timestamp
    const paymentDateTime = new Date(`${payment_date}T${payment_time}`)

    // Create payment history record
    await prisma.payment_history.create({
      data: {
        expense_id: expense.id,
        amount: amount,
        payment_method: payment_method === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
        paid_at: paymentDateTime,
        registrar_role: 'staff',
        registrar: staff.id,
        receipt_image: receipt_image || null,
        status: 'Success'
      }
    })

    // Check if expense is now fully paid and update status
    const newTotalPaid = totalPaid + amount
    if (newTotalPaid >= totalAmount) {
      await prisma.expenses.update({
        where: { id: expense.id },
        data: { status: 'Paid' }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment logged successfully'
    })
  } catch (error: any) {
    console.error('Error logging expense payment:', error)
    return NextResponse.json(
      { error: 'Failed to log payment' },
      { status: 500 }
    )
  }
}
