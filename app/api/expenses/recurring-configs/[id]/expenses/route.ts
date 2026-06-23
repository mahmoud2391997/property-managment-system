import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export type RecurringConfigExpenseItem = {
  id: string
  reference_id: string
  type: string | null
  status: string
  due_date: string | null
  amount: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'expenses.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: configId } = await params

    const config = await prisma.recurring_configs.findFirst({
      where: {
        id: configId,
        organization_id: staff.organization_id
      },
      select: { id: true }
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Recurring config not found' },
        { status: 404 }
      )
    }

    const expenses = await prisma.expenses.findMany({
      where: {
        recurring_config_id: configId
      },
      select: {
        id: true,
        reference_id: true,
        status: true,
        due_payment_date: true,
        charges: {
          select: {
            amount: true,
            is_taxed: true
          }
        },
        property_expenses: {
          select: { type: true }
        },
        company_expenses: {
          select: { type: true }
        }
      },
      orderBy: {
        due_payment_date: 'desc'
      }
    })

    const transformedExpenses: RecurringConfigExpenseItem[] = expenses.map(expense => {
      const totalAmount = expense.charges.reduce((sum, charge) => {
        const chargeAmount = charge.amount.toNumber()
        const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
        return sum + chargeAmount + tax
      }, 0)

      return {
        id: expense.id,
        reference_id: expense.reference_id || '',
        type: expense.property_expenses?.type || expense.company_expenses?.type || null,
        status: expense.status,
        due_date: expense.due_payment_date?.toISOString() || null,
        amount: totalAmount
      }
    })

    return NextResponse.json({ expenses: transformedExpenses })
  } catch (error: any) {
    console.error('Error fetching recurring config expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}
