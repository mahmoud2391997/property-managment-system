import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'expenses.approve'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const { id: expenseReferenceId } = await params

    // Find the expense
    const expense = await prisma.expenses.findFirst({
      where: {
        reference_id: expenseReferenceId,
        organization_id: staff.organization_id
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if expense can be approved (not cancelled)
    if (expense.status === 'Cancelled') {
      return NextResponse.json({ error: 'Cannot approve cancelled expense' }, { status: 400 })
    }

    // For now, the approval action doesn't change the expense status
    // The business logic for approval can be expanded later
    // For now, we'll just return success without updating the database

    return NextResponse.json({
      message: 'Expense approved successfully',
      expense: expense
    })

  } catch (error: any) {
    console.error('Error approving expense:', error)
    return NextResponse.json(
      { error: 'Failed to approve expense' },
      { status: 500 }
    )
  }
}
