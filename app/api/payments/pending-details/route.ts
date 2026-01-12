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
    const pendingPayments = await prisma.payments.findMany({
      where: {
        leases: { tenant_id: tenant.id },
        status: 'Pending'
      },
      select: {
        id: true,
        reference_id: true,
        due_payment_timestamp: true,
        charges: {
          select: {
            title: true,
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
      },
      orderBy: {
        due_payment_timestamp: 'asc'
      }
    })

    const now = new Date()

    // Calculate remaining amounts and categorize by status
    const paymentsWithDetails = pendingPayments.map(payment => {
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

      // Determine if payment is overdue
      const dueDate = payment.due_payment_timestamp ? new Date(payment.due_payment_timestamp) : null
      const isOverdue = dueDate ? now > dueDate : false

      // Get charge titles for display
      const chargesTitles = payment.charges.map(c => c.title).join(', ')

      return {
        id: payment.id,
        reference_id: payment.reference_id,
        due_date: payment.due_payment_timestamp?.toISOString() || null,
        total_amount: totalAmount,
        total_paid: totalPaid,
        remaining_amount: remainingAmount,
        is_overdue: isOverdue,
        charges_titles: chargesTitles
      }
    })

    // Filter out fully paid payments
    const actuallyPendingPayments = paymentsWithDetails.filter(
      p => p.remaining_amount > 0
    )

    // Categorize payments
    const overduePayments = actuallyPendingPayments.filter(p => p.is_overdue)
    const upcomingPayments = actuallyPendingPayments.filter(p => !p.is_overdue)

    // Calculate totals
    const overdueTotal = overduePayments.reduce((sum, p) => sum + p.remaining_amount, 0)
    const upcomingTotal = upcomingPayments.reduce((sum, p) => sum + p.remaining_amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        overdue_payments: overduePayments,
        upcoming_payments: upcomingPayments,
        overdue_count: overduePayments.length,
        upcoming_count: upcomingPayments.length,
        overdue_total: overdueTotal,
        upcoming_total: upcomingTotal,
        total_count: actuallyPendingPayments.length,
        total_amount: overdueTotal + upcomingTotal
      }
    })
  } catch (error: any) {
    console.error('Error fetching pending payments details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending payments details' },
      { status: 500 }
    )
  }
}
