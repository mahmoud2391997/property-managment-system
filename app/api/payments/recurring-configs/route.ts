import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export type RecurringPaymentConfigItem = {
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
  payments_count: number
  property_name: string | null
  property_id: string | null
  room_name: string | null
  lease_reference_id: string | null
}

export async function GET() {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const recurringConfigs = await prisma.recurring_configs.findMany({
      where: {
        type: 'Payment',
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
        lease_id: true,
        leases: {
          select: {
            reference_id: true,
            payment_day: true,
            properties: {
              select: {
                id: true,
                code: true
              }
            },
            rooms: {
              select: {
                title: true
              }
            }
          }
        },
        // Only fetch latest payment for amount/type calculation — not all payments
        payments: {
          select: {
            type: true,
            due_payment_timestamp: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
              }
            }
          },
          orderBy: {
            due_payment_timestamp: 'desc'
          },
          take: 1
        },
        _count: {
          select: { payments: true }
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
      lastPaymentDate: Date | null,
      paymentDay: number | null
    ): string | null => {
      if (every === null || timeUnit === null) {
        if (!paymentDay || !lastPaymentDate) return null
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

    const configs: RecurringPaymentConfigItem[] = recurringConfigs.map(config => {
      const latestPayment = config.payments[0]

      let amount: number | null = null
      if (config.is_payment_fixed && latestPayment) {
        amount = latestPayment.charges.reduce((sum, charge) => {
          const chargeAmount = charge.amount.toNumber()
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)
      }

      const lastPaymentDate = latestPayment?.due_payment_timestamp || null
      const paymentDay = config.leases?.payment_day ?? null

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
          ? calculateNextPaymentDate(config.every, config.time_unit, config.event_on, lastPaymentDate, paymentDay)
          : null,
        amount,
        payment_type: latestPayment?.type || null,
        payments_count: config._count.payments,
        property_name: config.leases?.properties?.code || null,
        property_id: config.leases?.properties?.id || null,
        room_name: config.leases?.rooms?.title || null,
        lease_reference_id: config.leases?.reference_id || null
      }
    })

    return NextResponse.json({ configs })
  } catch (error: any) {
    console.error('Error fetching recurring payment configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring payment configs' },
      { status: 500 }
    )
  }
}
