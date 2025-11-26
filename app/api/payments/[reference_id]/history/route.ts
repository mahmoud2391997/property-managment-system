'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference_id: string }> }
) {
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

    const { reference_id } = await params

    // Find the payment by reference_id and organization
    const payment = await prisma.payments.findUnique({
      where: {
        organization_id_reference_id: {
          organization_id: staff.organization_id,
          reference_id: reference_id
        }
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
          orderBy: {
            paid_at: 'desc'
          },
          select: {
            id: true,
            amount: true,
            payment_method: true,
            paid_at: true,
            receipt_image: true,
            status: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Calculate total amount
    const totalAmount = payment.charges.reduce((sum, charge) => {
      const amount = charge.amount
      const tax = charge.is_taxed ? amount * 0.08 : 0
      return sum + amount + tax
    }, 0)

    // Transform payment history with running totals
    let runningTotal = 0
    const transformedHistory = payment.payment_history.map((history, index) => {
      runningTotal += history.amount
      const remaining = totalAmount - runningTotal

      return {
        id: history.id,
        payment_number: payment.payment_history.length - index, // Reverse order (latest = #1)
        payment_method: history.payment_method,
        amount_paid: history.amount,
        remaining_amount: remaining > 0 ? remaining : 0,
        status: history.status,
        paid_at: history.paid_at.toISOString(),
        receipt_image: history.receipt_image
      }
    })

    return NextResponse.json({
      payment_history: transformedHistory,
      total_amount: totalAmount
    })
  } catch (error: any) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history', details: error.message },
      { status: 500 }
    )
  }
}
