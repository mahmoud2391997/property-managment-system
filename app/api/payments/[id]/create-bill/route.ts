'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { createBill, ringgitToCents, BILLPLZ_COLLECTION_ID } from '@/lib/billplz'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    // Check if user is tenant
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

    if (!staff && !tenant) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: reference_id } = await params

    // Find the payment by reference_id
    // For staff: check organization
    // For tenant: check if payment belongs to their lease
    const payment = staff
      ? await prisma.payments.findUnique({
          where: {
            organization_id_reference_id: {
              organization_id: staff.organization_id,
              reference_id: reference_id
            }
          },
          select: {
            id: true,
            reference_id: true,
            due_payment_timestamp: true,
            charges: {
              select: {
                title: true,
                amount: true,
                is_taxed: true
              }
            },
            leases: {
              select: {
                tenants: {
                  select: {
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
                }
              }
            }
          }
        })
      : await prisma.payments.findFirst({
          where: {
            reference_id: reference_id,
            leases: {
              tenant_id: tenant!.id
            }
          },
          select: {
            id: true,
            reference_id: true,
            due_payment_timestamp: true,
            charges: {
              select: {
                title: true,
                amount: true,
                is_taxed: true
              }
            },
            leases: {
              select: {
                tenants: {
                  select: {
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
                }
              }
            }
          }
        })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Calculate total amount including tax
    const totalAmount = payment.charges.reduce((sum, charge) => {
      const amount = charge.amount.toNumber()
      const tax = charge.is_taxed ? amount * 0.08 : 0
      return sum + amount + tax
    }, 0)

    // Check if payment is already fully paid
    // Only count SUCCESSFUL payments, not Pending or Failed
    const existingHistory = await prisma.payment_history.findMany({
      where: {
        payment_id: payment.id,
        status: 'Success'
      },
      select: { amount: true }
    })

    const totalPaid = existingHistory.reduce((sum, h) => sum + h.amount.toNumber(), 0)
    const remainingAmount = totalAmount - totalPaid

    if (remainingAmount <= 0) {
      return NextResponse.json(
        { error: 'Payment is already fully paid' },
        { status: 400 }
      )
    }

    // Check if there's a pending Billplz bill for this payment
    // Only check 'Pending' status, not 'Failed' (Failed means payment was attempted but rejected)
    const pendingBillHistory = await prisma.payment_history.findFirst({
      where: {
        payment_id: payment.id,
        billplz_bill_id: { not: null },
        status: 'Pending'
      },
      select: {
        billplz_bill_id: true,
        paid_at: true
      },
      orderBy: {
        paid_at: 'desc'
      }
    })

    // If there's a pending bill less than 24 hours old, check its status first
    if (pendingBillHistory?.billplz_bill_id) {
      const billAge = Date.now() - new Date(pendingBillHistory.paid_at).getTime()
      const hoursOld = billAge / (1000 * 60 * 60)

      if (hoursOld < 24) {
        try {
          const { getBill } = await import('@/lib/billplz')
          const billDetails = await getBill(pendingBillHistory.billplz_bill_id)

          // If the bill is already paid, redirect to check status instead
          if (billDetails.paid && billDetails.state === 'paid') {
            return NextResponse.json({
              redirect_to_check: true,
              message: 'A payment was already made. Please check payment status.',
              bill_id: pendingBillHistory.billplz_bill_id,
              payment_id: payment.id
            }, { status: 200 })
          }

          // If bill exists but not paid, return existing bill URL
          return NextResponse.json({
            success: true,
            payment_id: payment.id,
            bill_id: billDetails.id,
            payment_url: billDetails.url,
            amount: remainingAmount,
            existing_bill: true
          })
        } catch (error) {
          console.error('Error checking existing bill:', error)
          // Continue to create new bill if check fails
        }
      }
    }

    // Get tenant information
    const tenantData = staff ? payment.leases?.tenants : tenant

    if (!tenantData) {
      return NextResponse.json(
        { error: 'Tenant information not found' },
        { status: 404 }
      )
    }

    // Extract name, email, and phone based on tenant type
    const tenantEmail = tenantData.users.email
    const tenantName = tenantData.type === 'Individual'
      ? `${tenantData.individual_tenants?.first_name} ${tenantData.individual_tenants?.last_name || ''}`.trim()
      : tenantData.company_tenants?.company_name || 'Tenant'
    const tenantPhone = tenantData.type === 'Individual'
      ? tenantData.individual_tenants?.phone_number
      : undefined

    if (!tenantEmail) {
      return NextResponse.json(
        { error: 'Tenant email not found' },
        { status: 404 }
      )
    }

    // Create description from charges
    const chargesDescription = payment.charges
      .map(charge => charge.title)
      .join(', ')

    // Create Billplz bill
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
      amount: ringgitToCents(remainingAmount), // Convert RM to cents
      callback_url: `${appUrl}/api/webhooks/billplz`,
      redirect_url: `${appUrl}/payments?payment_check=true&payment_id=${payment.id}`,
      description: `Payment for ${chargesDescription} (Ref: ${payment.reference_id})`,
      reference_1_label: 'Payment Reference',
      reference_1: payment.reference_id,
      reference_2_label: 'Payment ID',
      reference_2: payment.id
    })

    // Create pending payment_history record immediately
    // This allows "Check payment status" to work cross-device by querying database
    await prisma.payment_history.create({
      data: {
        payment_id: payment.id,
        amount: remainingAmount,
        payment_method: 'FPX',
        paid_at: new Date(), // Record creation time
        status: 'Pending',
        receipt_image: null,
        registrar_role: user.id === staff?.id ? 'staff' : 'tenant',
        registrar: staff?.id || null,
        billplz_bill_id: billData.id,
        billplz_transaction_id: null
      }
    })

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      bill_id: billData.id,
      payment_url: billData.url,
      amount: remainingAmount
    })
  } catch (error: any) {
    console.error('Error creating Billplz bill:', error)
    return NextResponse.json(
      { error: 'Failed to create payment bill' },
      { status: 500 }
    )
  }
}
