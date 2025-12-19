'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

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

    // Get current staff and organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const { id: reference_id } = await params

    // Find the expense by reference_id
    const expense = await prisma.expenses.findFirst({
      where: {
        organization_id: staff.organization_id,
        reference_id: reference_id
      },
      select: {
        id: true,
        payment_history: {
          where: {
            status: 'Success'
          },
          select: {
            id: true
          }
        }
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if there are any successful payments
    if (expense.payment_history.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete expense with payment history',
          has_successful_payment: true
        },
        { status: 400 }
      )
    }

    // Delete the expense (charges and payment_history will cascade or be deleted)
    await prisma.$transaction(async (tx) => {
      // Delete any payment history records first
      await tx.payment_history.deleteMany({
        where: { expense_id: expense.id }
      })

      // Delete charges
      await tx.charges.deleteMany({
        where: { expense_id: expense.id }
      })

      // Delete the expense
      await tx.expenses.delete({
        where: { id: expense.id }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
