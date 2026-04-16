import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions } = await getUserAndStaff()
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: referenceId } = await params
    const body = await request.json()
    const { charges } = body

    if (!charges || !Array.isArray(charges) || charges.length === 0) {
      return NextResponse.json({ error: 'Charges are required' }, { status: 400 })
    }

    // Get the payment
    const payment = await prisma.payments.findFirst({
      where: {
        reference_id: referenceId,
        organization_id: staff.organization_id
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Only allow setting charges on Unset payments
    if (payment.status !== 'Unset') {
      return NextResponse.json(
        { error: 'Can only set charges on Unset payments' },
        { status: 400 }
      )
    }

    // Update payment status and add charges
    await prisma.$transaction(async (tx) => {
      // Update payment status to Pending
      await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: 'Pending'
        }
      })

      // Create charges
      const chargeData = charges.map((charge: any) => ({
        payment_id: payment.id,
        title: charge.type,
        amount: parseFloat(charge.amount),
        is_taxed: charge.taxable || false
      }))

      await tx.charges.createMany({
        data: chargeData
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error setting charges:', error)
    return NextResponse.json(
      { error: 'Failed to set charges' },
      { status: 500 }
    )
  }
}
