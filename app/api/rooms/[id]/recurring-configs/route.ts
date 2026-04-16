import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { RecurringConfigWithDetails } from '@/app/api/properties/[id]/recurring-configs/route'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'rooms.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: roomId } = await params

    // Verify room belongs to the organization
    const room = await prisma.rooms.findFirst({
      where: {
        id: roomId,
        properties: {
          organization_id: staff.organization_id
        }
      },
      select: {
        id: true,
        property_id: true
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Find current lease for this room
    const currentLease = await prisma.leases.findFirst({
      where: {
        room_id: roomId,
        status: 'Current'
      },
      select: {
        id: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    if (!currentLease) {
      return NextResponse.json({
        recurringPayments: []
      })
    }

    // Fetch recurring configs linked to this lease (room lease)
    const recurringConfigs = await prisma.recurring_configs.findMany({
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

    // Calculate next payment date based on recurring config
    const calculateNextPaymentDate = (
      every: number | null,
      timeUnit: string | null,
      eventOn: string | null,
      lastPaymentDate: Date | null
    ): string | null => {
      // If every or timeUnit is null, we can't calculate (new recurring payment model)
      if (every === null || timeUnit === null) {
        return null
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

    // Transform recurring configs
    const recurringPayments = recurringConfigs.map(config => {
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
          ? calculateNextPaymentDate(config.every, config.time_unit, config.event_on, lastPaymentDate)
          : null,
        amount,
        payment_type: latestPayment?.type || null,
        payments_count: config.payments.length,
        payments
      }
    })

    return NextResponse.json({
      recurringPayments
    })
  } catch (error: any) {
    console.error('Error fetching room recurring configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring configs' },
      { status: 500 }
    )
  }
}
