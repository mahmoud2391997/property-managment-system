import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export type RecurringConfigPaymentItem = {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id: configId } = await params

    // Verify config belongs to organization
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

    const payments = await prisma.payments.findMany({
      where: {
        recurring_config_id: configId
      },
      select: {
        id: true,
        reference_id: true,
        type: true,
        status: true,
        due_payment_timestamp: true,
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
    })

    const transformedPayments: RecurringConfigPaymentItem[] = payments.map(payment => {
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

    return NextResponse.json({ payments: transformedPayments })
  } catch (error: any) {
    console.error('Error fetching recurring config payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
