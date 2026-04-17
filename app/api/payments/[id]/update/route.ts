'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error
    if (!hasPermission(permissions, 'payments.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: reference_id } = await params

    // Find the payment
    const payment = await prisma.payments.findFirst({
      where: {
        reference_id,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        type: true,
        status: true,
        payment_history: {
          where: { status: 'Success' },
          select: { id: true }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Rental payments cannot be edited
    if (payment.type === 'Rental') {
      return NextResponse.json(
        { error: 'Rental payments cannot be edited' },
        { status: 400 }
      )
    }

    // Cannot edit if there are successful payments
    if (payment.payment_history.length > 0) {
      return NextResponse.json(
        { error: 'Cannot edit payment with payment history' },
        { status: 400 }
      )
    }

    // Cannot edit cancelled payments
    if (payment.status === 'Cancelled') {
      return NextResponse.json(
        { error: 'Cannot edit cancelled payments' },
        { status: 400 }
      )
    }

    // Cannot edit if there's a pending FPX payment within 20-minute cooling period
    const pendingFpxHistory = await prisma.payment_history.findFirst({
      where: {
        payment_id: payment.id,
        status: 'Pending',
        payment_method: 'FPX',
        created_at: { gte: new Date(Date.now() - 20 * 60 * 1000) }
      },
      select: { id: true }
    })
    if (pendingFpxHistory) {
      return NextResponse.json(
        { error: 'Cannot edit payment while FPX payment is being processed' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      charges,
      due_date,
      due_time,
      timezone_offset
    } = body

    // Validate charges
    if (!charges || !Array.isArray(charges) || charges.length === 0) {
      return NextResponse.json(
        { error: 'At least one charge is required' },
        { status: 400 }
      )
    }

    // Build due_payment_timestamp if provided
    let dueTimestamp: Date | null = null
    if (due_date && due_time) {
      const offset = timezone_offset ?? 0
      const localDateTimeStr = `${due_date}T${due_time}`
      const localDate = new Date(localDateTimeStr)
      dueTimestamp = new Date(localDate.getTime() + offset * 60 * 1000)
    }

    // Update in a transaction
    await prisma.$transaction(async tx => {
      // Update due date if provided
      if (dueTimestamp !== null) {
        await tx.payments.update({
          where: { id: payment.id },
          data: { due_payment_timestamp: dueTimestamp }
        })
      }

      // Replace charges (delete old, create new)
      await tx.charges.deleteMany({
        where: { payment_id: payment.id }
      })

      await tx.charges.createMany({
        data: charges.map((charge: any) => ({
          payment_id: payment.id,
          title: charge.type || charge.title,
          amount: parseFloat(charge.amount) || 0,
          is_taxed: charge.isTaxableChecked ?? charge.is_taxed ?? false,
          is_refunded: charge.isRefundableChecked ?? charge.is_refunded ?? false,
          created_by: staff.id
        }))
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
