'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { handleRecurringPaymentGeneration } from '@/lib/recurring-payments-utils'

export async function POST (request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

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

    const body = await request.json()
    const {
      reference_id,
      payment_type,
      charges,
      is_paid,
      payment_method,
      payment_date,
      payment_time,
      receipt_image,
      payment_evidence,
      recurring_config
    } = body

    // Validate required fields
    if (!reference_id || !payment_type || !charges || charges.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!payment_date || !payment_time) {
      return NextResponse.json(
        { error: 'Payment date and time are required' },
        { status: 400 }
      )
    }

    // Combine date and time into timestamp
    const paymentDateTime = new Date(`${payment_date}T${payment_time}`)

    // Determine payment status
    const status = is_paid ? 'Paid' : 'Pending'

    // Calculate total amount from charges
    const totalAmount = charges.reduce((sum: number, charge: any) => {
      const amount = parseFloat(charge.amount) || 0
      const tax = charge.isTaxableChecked ? amount * 0.08 : 0
      return sum + amount + tax
    }, 0)

    // Create payment with charges and payment_history in a transaction
    const result = await prisma.$transaction(async tx => {
      const lease = await tx.leases.findUnique({
        where: {
          organization_id_reference_id: {
            organization_id: staff.organization_id,
            reference_id: reference_id
          }
        },
        select: { id: true }
      })

      // Generate payment_reference_id
      const currentYear = new Date().getFullYear()
      const yearPrefix = `PY-${currentYear}`

      // Get the latest payment for this year and organization
      const latestPayment = await tx.payments.findFirst({
        where: {
          organization_id: staff.organization_id,
          reference_id: {
            startsWith: yearPrefix
          }
        },
        orderBy: {
          reference_id: 'desc'
        },
        select: {
          reference_id: true
        }
      })

      let nextSequence = 1
      if (latestPayment) {
        // Extract the last 8 digits and increment
        const lastSequence = parseInt(latestPayment.reference_id.slice(-8))
        nextSequence = lastSequence + 1
      }

      // Format: PY-YYYY00000001
      const payment_reference_id = `${yearPrefix}${nextSequence.toString().padStart(8, '0')}`

      // Create payment
      const payment = await tx.payments.create({
        data: {
          reference_id: payment_reference_id,
          lease_id: lease?.id,
          type: payment_type,
          status,
          due_payment_timestamp: is_paid ? null : paymentDateTime,
          payment_evidence: payment_evidence || null,
          organization_id: staff.organization_id,
          created_by: staff.id,
          charges: {
            create: charges.map((charge: any) => ({
              title: charge.type,
              amount: parseFloat(charge.amount) || 0,
              is_taxed: charge.isTaxableChecked || false,
              is_refunded: charge.isRefundableChecked || false,
              created_by: staff.id
            }))
          }
        }
      })

      // If paid, create payment_history entry
      if (is_paid) {
        await tx.payment_history.create({
          data: {
            payment_id: payment.id,
            amount: totalAmount,
            payment_method:
              payment_method === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
            paid_at: paymentDateTime,
            registrar_role: 'staff',
            registrar: staff.id,
            receipt_image: receipt_image || null,
            status: 'Success'
          }
        })
      }

      // If recurring config is provided and payment type is recurrable
      // Create recurring config linked to the lease and organization first
      // Then link the payment to the recurring config
      if (recurring_config && recurring_config.enabled) {
        const newRecurringConfig = await tx.recurring_configs.create({
          data: {
            lease_id: lease?.id,
            organization_id: staff.organization_id,
            title: recurring_config.title,
            every: recurring_config.every,
            time_unit: recurring_config.time_unit,
            event_on: recurring_config.event_on || null,
            is_payment_fixed: recurring_config.is_payment_fixed ?? false,
            created_by: staff.id
          }
        })

        // Link the payment to the recurring config
        await tx.payments.update({
          where: { id: payment.id },
          data: { recurring_config_id: newRecurringConfig.id }
        })
      }

      return payment
    })

    // After successful payment creation, check if this is a recurring payment and generate next one
    let recurringPaymentGenerated = false
    if (is_paid && recurring_config && recurring_config.enabled) {
      try {
        await handleRecurringPaymentGeneration(result.id, staff.organization_id)
        recurringPaymentGenerated = true
      } catch (recurringError) {
        // Log error but don't fail the payment creation
        console.error('Error generating recurring payment:', recurringError)
      }
    }

    return NextResponse.json({
      success: true,
      payment_id: result.id,
      message: 'Payment created successfully',
      recurring_payment_generated: recurringPaymentGenerated
    })
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
