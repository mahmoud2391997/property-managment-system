import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export type RecurringPaymentDetails = {
  id: string
  reference_id: string
  type: string
  status: string
  due_date: string | null
  amount: number
  charges: {
    title: string
    amount: number
    is_taxed: boolean
  }[]
}

export type RecurringExpenseDetails = {
  id: string
  reference_id: string
  type: string | null
  status: string
  due_date: string | null
  amount: number
}

export type RecurringConfigWithDetails = {
  id: string
  title: string
  every: number | null
  time_unit: string | null
  event_on: string | null
  is_payment_fixed: boolean
  is_active: boolean
  created_at: string
  next_payment_date: string | null
  amount: number | null // null if not fixed (determined by staff)
  payment_type: string | null
  payments_count: number
  payments: RecurringPaymentDetails[]
  expenses_count: number
  expenses: RecurringExpenseDetails[]
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'properties.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: propertyId } = await params

    // Verify property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Find current lease for this property
    const currentLease = await prisma.leases.findFirst({
      where: {
        property_id: propertyId,
        room_id: null, // Property-level lease only
        status: 'Current'
      },
      select: {
        id: true,
        payment_day: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    if (!currentLease) {
      // No active lease — skip payments but still fetch expenses below
    }

    // Fetch recurring configs linked to this lease (only if lease exists)
    const recurringConfigs = currentLease
      ? await prisma.recurring_configs.findMany({
          where: {
            lease_id: currentLease.id,
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
            payments: {
              select: {
                id: true,
                reference_id: true,
                type: true,
                status: true,
                due_payment_timestamp: true,
                created_at: true,
                charges: {
                  select: {
                    amount: true,
                    is_taxed: true,
                    title: true
                  }
                }
              },
              orderBy: {
                due_payment_timestamp: 'desc'
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        })
      : []

    // Calculate next payment date based on recurring config
    const calculateNextPaymentDate = (
      every: number | null,
      timeUnit: string | null,
      eventOn: string | null,
      lastPaymentDate: Date | null,
      paymentDay: number | null
    ): string | null => {
      // If every or timeUnit is null, calculate based on payment_day (new recurring payment model)
      if (every === null || timeUnit === null) {
        if (!paymentDay || !lastPaymentDate) {
          return null
        }

        // Calculate next month's payment based on last payment date and payment_day
        const currentPaymentDate = new Date(lastPaymentDate)
        const nextMonth = currentPaymentDate.getMonth() + 1
        const nextYear = nextMonth > 11 ? currentPaymentDate.getFullYear() + 1 : currentPaymentDate.getFullYear()
        const adjustedMonth = nextMonth % 12

        const nextPaymentDate = new Date(nextYear, adjustedMonth, paymentDay)
        nextPaymentDate.setHours(0, 0, 0, 0)

        return nextPaymentDate.toISOString()
      }
      const now = new Date()
      const baseDate = lastPaymentDate || now

      let nextDate = new Date(baseDate)

      switch (timeUnit) {
        case 'Day':
          nextDate.setDate(nextDate.getDate() + every)
          break
        case 'Week':
          if (eventOn) {
            // eventOn contains comma-separated day codes like "Mo,We,Fr"
            const dayMap: Record<string, number> = {
              Su: 0,
              Mo: 1,
              Tu: 2,
              We: 3,
              Th: 4,
              Fr: 5,
              Sa: 6
            }
            const targetDays = eventOn.split(',').map(d => dayMap[d]).filter(d => d !== undefined)
            if (targetDays.length > 0) {
              // Find next occurrence
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
            // eventOn contains comma-separated day numbers like "1,15"
            const targetDays = eventOn.split(',').map(d => parseInt(d)).filter(d => !isNaN(d))
            if (targetDays.length > 0) {
              // Find next occurrence
              let checkDate = new Date(now.getFullYear(), now.getMonth(), targetDays[0])
              if (checkDate <= now) {
                // Try next month
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

      // Make sure next date is in the future
      while (nextDate <= now) {
        switch (timeUnit) {
          case 'Day':
            nextDate.setDate(nextDate.getDate() + every)
            break
          case 'Week':
            nextDate.setDate(nextDate.getDate() + every * 7)
            break
          case 'Month':
            nextDate.setMonth(nextDate.getMonth() + every)
            break
          case 'Year':
            nextDate.setFullYear(nextDate.getFullYear() + every)
            break
        }
      }

      return nextDate.toISOString()
    }

    // Transform recurring configs for payments
    const recurringPayments: RecurringConfigWithDetails[] = recurringConfigs.map(config => {
      const latestPayment = config.payments[0]

      // Calculate amount from charges if fixed
      let amount: number | null = null
      if (config.is_payment_fixed && latestPayment) {
        amount = latestPayment.charges.reduce((sum, charge) => {
          const chargeAmount = charge.amount.toNumber()
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)
      }

      const lastPaymentDate = latestPayment?.due_payment_timestamp || null

      // Transform all payments under this config
      const payments = config.payments.map(payment => {
        const totalAmount = payment.charges.reduce((sum, charge) => {
          const chargeAmount = charge.amount.toNumber()
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)

        return {
          id: payment.id,
          reference_id: payment.reference_id,
          type: payment.type,
          status: payment.status,
          due_date: payment.due_payment_timestamp?.toISOString() || null,
          amount: totalAmount,
          charges: payment.charges.map(charge => ({
            title: charge.title,
            amount: charge.amount.toNumber(),
            is_taxed: charge.is_taxed
          }))
        }
      })

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
          ? calculateNextPaymentDate(config.every, config.time_unit, config.event_on, lastPaymentDate, currentLease?.payment_day ?? null)
          : null,
        amount,
        payment_type: latestPayment?.type || null,
        payments_count: config.payments.length,
        payments,
        expenses_count: 0,
        expenses: []
      }
    })

    // Fetch recurring expenses linked directly to this property (not via lease)
    const expenseRecurringConfigs = await prisma.recurring_configs.findMany({
      where: {
        property_id: propertyId,
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
        expenses: {
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
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform recurring configs for expenses
    const recurringExpenses: RecurringConfigWithDetails[] = expenseRecurringConfigs.map(config => {
      const latestExpense = config.expenses[0]

      // Calculate amount from charges if fixed
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

      // Transform all expenses under this config
      const expenses: RecurringExpenseDetails[] = config.expenses.map(expense => {
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
          ? calculateNextPaymentDate(config.every, config.time_unit, config.event_on, lastExpenseDate, null)
          : null,
        amount,
        payment_type: expenseType,
        payments_count: 0,
        payments: [],
        expenses_count: config.expenses.length,
        expenses
      }
    })

    return NextResponse.json({
      recurringPayments,
      recurringExpenses
    })
  } catch (error: any) {
    console.error('Error fetching recurring configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring configs' },
      { status: 500 }
    )
  }
}