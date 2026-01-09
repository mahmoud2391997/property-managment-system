'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { createBill, ringgitToCents, BILLPLZ_COLLECTION_ID } from '@/lib/billplz'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only tenants can create group bills
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        type: true,
        individual_tenants: {
          select: {
            first_name: true,
            last_name: true,
            phone_number: true
          }
        },
        company_tenants: {
          select: {
            company_name: true
          }
        },
        users: {
          select: {
            email: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Only tenants can access this endpoint' }, { status: 403 })
    }

    // Fetch all pending payments for this tenant
    const pendingPayments = await prisma.payments.findMany({
      where: {
        leases: { tenant_id: tenant.id },
        status: 'Pending'
      },
      select: {
        id: true,
        reference_id: true,
        charges: {
          select: {
            title: true,
            amount: true,
            is_taxed: true
          }
        },
        payment_history: {
          where: {
            status: 'Success'
          },
          select: {
            amount: true
          }
        }
      }
    })

    // Calculate remaining amounts for each payment
    const paymentsWithRemaining = pendingPayments.map(payment => {
      // Calculate total amount including tax
      const totalAmount = payment.charges.reduce((sum, charge) => {
        const amount = charge.amount.toNumber()
        const tax = charge.is_taxed ? amount * 0.08 : 0
        return sum + amount + tax
      }, 0)

      // Calculate total paid from successful payment history
      const totalPaid = payment.payment_history.reduce(
        (sum, history) => sum + history.amount.toNumber(),
        0
      )

      // Calculate remaining amount
      const remainingAmount = totalAmount - totalPaid

      return {
        payment_id: payment.id,
        reference_id: payment.reference_id,
        charges: payment.charges,
        remaining_amount: remainingAmount
      }
    })

    // Filter out fully paid payments
    const actuallyPendingPayments = paymentsWithRemaining.filter(
      p => p.remaining_amount > 0
    )

    if (actuallyPendingPayments.length === 0) {
      return NextResponse.json(
        { error: 'No pending payments found' },
        { status: 400 }
      )
    }

    // Calculate total remaining amount
    const totalRemainingAmount = actuallyPendingPayments.reduce(
      (sum, p) => sum + p.remaining_amount,
      0
    )

    // Add Billplz FPX transaction fee
    const FPX_FEE_PER_TRANSACTION = 1.20
    const totalAmountWithFee = totalRemainingAmount + FPX_FEE_PER_TRANSACTION

    // Check if there are any pending group bills for this tenant
    const existingGroupBill = await prisma.payment_history.findFirst({
      where: {
        payments: {
          leases: {
            tenant_id: tenant.id
          }
        },
        billplz_bill_id: { not: null },
        status: 'Pending',
        group_payment: true
      },
      select: {
        billplz_bill_id: true,
        paid_at: true
      },
      orderBy: {
        paid_at: 'desc'
      }
    })

    // If there's a pending group bill, check its status first
    if (existingGroupBill?.billplz_bill_id) {
      try {
        const { getBillWithTransaction } = await import('@/lib/billplz')
        const billDetails = await getBillWithTransaction(existingGroupBill.billplz_bill_id)

        // Verify bill amount matches current total (convert cents to RM)
        const existingBillAmount = billDetails.amount / 100
        const amountMatches = Math.abs(existingBillAmount - totalAmountWithFee) < 0.01 // Allow 1 cent difference for rounding

        // If the bill is already paid, redirect to check status
        if (billDetails.paid && billDetails.state === 'paid') {
          // SECURITY: Verify transaction ID exists for legitimate payment
          if (!billDetails.transaction_id) {
            console.error('⚠️ Group bill marked as paid but no transaction_id - treating as suspicious')
            // Continue to create new bill instead
          } else {
            return NextResponse.json({
              redirect_to_check: true,
              message: 'A payment was already made. Please check payment status.',
              bill_id: existingGroupBill.billplz_bill_id
            }, { status: 200 })
          }
        } else if (billDetails.state === 'due') {
          // Only return existing bill if amount matches current total
          if (amountMatches) {
            // If bill exists but not paid, return existing bill URL
            return NextResponse.json({
              success: true,
              bill_id: billDetails.id,
              payment_url: billDetails.url,
              amount: totalAmountWithFee,
              payment_count: actuallyPendingPayments.length,
              existing_bill: true
            })
          } else {
            console.log(`⚠️ Existing bill amount mismatch: Bill has RM${existingBillAmount}, but current total is RM${totalAmountWithFee}. Creating new bill.`)
            // Amount mismatch - mark old pending records as Failed and create new bill
            await prisma.payment_history.updateMany({
              where: {
                billplz_bill_id: existingGroupBill.billplz_bill_id,
                status: 'Pending'
              },
              data: {
                status: 'Failed'
              }
            })
            // Continue to create new bill
          }
        }
        // If bill state is failed or other, continue to create new bill
      } catch (error) {
        console.error('Error checking existing group bill:', error)
        // Continue to create new bill if check fails
      }
    }

    // Extract tenant information
    const tenantEmail = tenant.users.email
    const tenantName = tenant.type === 'Individual'
      ? `${tenant.individual_tenants?.first_name} ${tenant.individual_tenants?.last_name || ''}`.trim()
      : tenant.company_tenants?.company_name || 'Tenant'
    const tenantPhone = tenant.type === 'Individual'
      ? tenant.individual_tenants?.phone_number
      : undefined

    if (!tenantEmail) {
      return NextResponse.json(
        { error: 'Tenant email not found' },
        { status: 404 }
      )
    }

    // Create description from all payment references
    const paymentReferences = actuallyPendingPayments
      .map(p => p.reference_id)
      .join(', ')

    // Create Billplz bill for total amount
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json(
        { error: 'Application URL not configured' },
        { status: 500 }
      )
    }

    const billData = await createBill({
      collection_id: BILLPLZ_COLLECTION_ID!,
      email: tenantEmail,
      mobile: tenantPhone,
      name: tenantName,
      amount: ringgitToCents(totalAmountWithFee),
      callback_url: `${appUrl}/api/webhooks/billplz`,
      redirect_url: `${appUrl}/payments?payment_check=true&group_payment=true`,
      description: `Group payment for ${actuallyPendingPayments.length} payments (Refs: ${paymentReferences})`,
      reference_1_label: 'Payment Count',
      reference_1: actuallyPendingPayments.length.toString(),
      reference_2_label: 'Group Payment',
      reference_2: 'true'
    })

    // Create payment_history records for each payment with the same billplz_bill_id
    const historyRecords = actuallyPendingPayments.map(payment => ({
      payment_id: payment.payment_id,
      amount: payment.remaining_amount,
      payment_method: 'FPX' as const,
      paid_at: new Date(),
      status: 'Pending' as const,
      receipt_image: null,
      registrar_role: 'tenant' as const,
      registrar: null,
      billplz_bill_id: billData.id,
      billplz_transaction_id: null,
      group_payment: true
    }))

    await prisma.payment_history.createMany({
      data: historyRecords
    })

    return NextResponse.json({
      success: true,
      bill_id: billData.id,
      payment_url: billData.url,
      amount: totalAmountWithFee,
      payment_count: actuallyPendingPayments.length,
      payment_ids: actuallyPendingPayments.map(p => p.payment_id)
    })
  } catch (error: any) {
    console.error('Error creating group payment bill:', error)
    return NextResponse.json(
      { error: 'Failed to create group payment bill' },
      { status: 500 }
    )
  }
}
