import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export type RecurringExpenseConfigWithProperty = {
  id: string
  title: string
  every: number | null
  time_unit: string | null
  event_on: string | null
  is_payment_fixed: boolean
  is_active: boolean
  created_at: string
  next_payment_date: string | null
  amount: number | null
  payment_type: string | null
  expenses_count: number
  property_name: string | null
  property_id: string | null
}

export async function GET() {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'expenses.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const expenseRecurringConfigs = await prisma.recurring_configs.findMany({
      where: {
        type: 'Expense',
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        title: true,
        every: true,
        time_unit: true,
        event_on: true,
        is_payment_fixed: true,
        is_active: true,
        created_at: true,
        property_id: true,
        properties: {
          select: {
            code: true
          }
        },
        // Only fetch latest expense for amount/type calculation
        expenses: {
          select: {
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
          },
          take: 1
        },
        _count: {
          select: { expenses: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    const calculateNextPaymentDate = (
      every: number | null,
      timeUnit: string | null,
      eventOn: string | null,
      lastPaymentDate: Date | null
    ): string | null => {
      const now = new Date()
      const baseDate = lastPaymentDate || now

      if (every === null || timeUnit === null) {
        return null
      }

      let nextDate = new Date(baseDate)

      switch (timeUnit) {
        case 'Day':
          nextDate.setDate(nextDate.getDate() + every)
          break
        case 'Week':
          if (eventOn) {
            const dayMap: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 }
            const targetDays = eventOn.split(',').map(d => dayMap[d]).filter(d => d !== undefined)
            if (targetDays.length > 0) {
              let daysToAdd = 1
              while (daysToAdd <= every * 7) {
                const checkDate = new Date(baseDate)
                checkDate.setDate(checkDate.getDate() + daysToAdd)
                if (targetDays.includes(checkDate.getDay()) && checkDate > now) {
                  nextDate = checkDate
                  break
                }
                daysToAdd++
              }
            }
          } else {
            nextDate.setDate(nextDate.getDate() + every * 7)
          }
          break
        case 'Month':
          if (eventOn) {
            const targetDays = eventOn.split(',').map(d => parseInt(d)).filter(d => !isNaN(d))
            if (targetDays.length > 0) {
              let checkDate = new Date(now.getFullYear(), now.getMonth(), targetDays[0])
              if (checkDate <= now) {
                checkDate = new Date(now.getFullYear(), now.getMonth() + 1, targetDays[0])
              }
              nextDate = checkDate
            }
          } else {
            nextDate.setMonth(nextDate.getMonth() + every)
          }
          break
        case 'Year':
          nextDate.setFullYear(nextDate.getFullYear() + every)
          break
      }

      while (nextDate <= now) {
        switch (timeUnit) {
          case 'Day': nextDate.setDate(nextDate.getDate() + every); break
          case 'Week': nextDate.setDate(nextDate.getDate() + every * 7); break
          case 'Month': nextDate.setMonth(nextDate.getMonth() + every); break
          case 'Year': nextDate.setFullYear(nextDate.getFullYear() + every); break
        }
      }

      return nextDate.toISOString()
    }

    const recurringExpenses: RecurringExpenseConfigWithProperty[] = expenseRecurringConfigs.map(config => {
      const latestExpense = config.expenses[0]

      let amount: number | null = null
      if (config.is_payment_fixed && latestExpense) {
        amount = latestExpense.charges.reduce((sum, charge) => {
          const chargeAmount = charge.amount.toNumber()
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)
      }

      const lastExpenseDate = latestExpense?.due_payment_date || null
      const expenseType = latestExpense?.property_expenses?.type
        || latestExpense?.company_expenses?.type
        || null

      return {
        id: config.id,
        title: config.title,
        every: config.every,
        time_unit: config.time_unit,
        event_on: config.event_on,
        is_payment_fixed: config.is_payment_fixed ?? false,
        is_active: config.is_active,
        created_at: config.created_at.toISOString(),
        next_payment_date: config.is_active
          ? calculateNextPaymentDate(config.every, config.time_unit, config.event_on, lastExpenseDate)
          : null,
        amount,
        payment_type: expenseType,
        expenses_count: config._count.expenses,
        property_name: config.properties?.code || null,
        property_id: config.property_id
      }
    })

    return NextResponse.json({ recurringExpenses })
  } catch (error: any) {
    console.error('Error fetching recurring expense configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring expense configs' },
      { status: 500 }
    )
  }
}
