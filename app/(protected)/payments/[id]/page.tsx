export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import PaymentDetailsContent from './payment-details-content'
type Props = {
  params: Promise<{ id: string }>
}

type ChargeData = {
  id: string
  title: string
  amount: number
  is_taxed: boolean
  is_refunded: boolean
}

type PaymentHistoryData = {
  id: string
  payment_number: number
  payment_method: string
  amount: number
  remaining_amount: number
  status: string
  paid_at: string
  receipt_image: string | null
}

export type PaymentDetailsData = {
  id: string
  reference_id: string
  type: string
  status: string
  due_payment_timestamp: string | null
  created_at: string
  payment_evidence: string | null
  lease: {
    id: string
    reference_id: string
    monthly_rent: number
    payment_day: number
    property: {
      id: string
      code: string
      street_address: string
      city: string
    }
    room: {
      id: string
      title: string
    } | null
    tenant: {
      id: string
      type: string
      profile_pic: string | null
      name: string
      phone: string | null
      email: string | null
    }
  } | null
  charges: ChargeData[]
  payment_history: PaymentHistoryData[]
  recurring_config: {
    id: string
    title: string | null
    every: number | null
    time_unit: string | null
    event_on: string | null
    is_payment_fixed: boolean
  } | null
  total_amount: number
  total_paid: number
  remaining_amount: number
  payment_percentage: number
}

async function getPaymentDetails(referenceId: string): Promise<PaymentDetailsData | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Check if user is staff or tenant
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!staff && !tenant) return null

    // Build where clause based on user type
    const whereClause = staff
      ? { reference_id: referenceId, organization_id: staff.organization_id }
      : { reference_id: referenceId, leases: { tenant_id: tenant!.id } }

    const payment = await prisma.payments.findFirst({
      where: whereClause,
      select: {
        id: true,
        reference_id: true,
        type: true,
        status: true,
        due_payment_timestamp: true,
        created_at: true,
        payment_evidence: true,
        leases: {
          select: {
            id: true,
            reference_id: true,
            monthly_rent: true,
            payment_day: true,
            properties: {
              select: {
                id: true,
                code: true,
                street_address: true,
                city: true
              }
            },
            rooms: {
              select: {
                id: true,
                title: true
              }
            },
            tenants: {
              select: {
                id: true,
                type: true,
                profile_pic: true,
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
        },
        charges: {
          select: {
            id: true,
            title: true,
            amount: true,
            is_taxed: true,
            is_refunded: true
          },
          orderBy: { created_at: 'asc' }
        },
        payment_history: {
          where: {
            status: 'Success'
          },
          select: {
            id: true,
            payment_method: true,
            amount: true,
            status: true,
            paid_at: true,
            receipt_image: true
          },
          orderBy: { paid_at: 'asc' }
        },
        recurring_configs: {
          select: {
            id: true,
            title: true,
            every: true,
            time_unit: true,
            event_on: true,
            is_payment_fixed: true
          }
        }
      }
    })

    if (!payment) return null

    // Calculate totals
    const totalAmount = payment.charges.reduce((sum: number, charge) => {
      const amount = charge.amount.toNumber()
      const tax = charge.is_taxed ? amount * 0.08 : 0
      return sum + amount + tax
    }, 0)

    const totalPaid = payment.payment_history.reduce((sum: number, h) => sum + h.amount.toNumber(), 0)
    const remainingAmount = totalAmount - totalPaid
    const paymentPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

    // Get tenant info
    const tenantData = payment.leases?.tenants
    let tenantName = 'N/A'
    let tenantPhone: string | null = null
    let tenantEmail: string | null = null

    if (tenantData) {
      if (tenantData.type === 'Individual' && tenantData.individual_tenants) {
        tenantName = `${tenantData.individual_tenants.first_name} ${tenantData.individual_tenants.last_name || ''}`.trim()
        tenantPhone = tenantData.individual_tenants.phone_number || null
      } else if (tenantData.type === 'Company' && tenantData.company_tenants) {
        tenantName = tenantData.company_tenants.company_name
      }
      tenantEmail = tenantData.users?.email || null
    }

    // Transform payment history with calculated fields
    let runningTotal = 0
    const transformedHistory: PaymentHistoryData[] = payment.payment_history.map((h, index) => {
      runningTotal += h.amount.toNumber()
      const remaining = totalAmount - runningTotal

      return {
        id: h.id,
        payment_number: index + 1,
        payment_method: h.payment_method,
        amount: h.amount.toNumber(),
        remaining_amount: remaining > 0 ? remaining : 0,
        status: h.status,
        paid_at: h.paid_at.toISOString(),
        receipt_image: h.receipt_image
      }
    })

    // Reverse to show newest first for display
    transformedHistory.reverse()

    // Transform charges to plain numbers
    const transformedCharges: ChargeData[] = payment.charges.map(c => ({
      id: c.id,
      title: c.title,
      amount: c.amount.toNumber(),
      is_taxed: c.is_taxed,
      is_refunded: c.is_refunded
    }))

    return {
      id: payment.id,
      reference_id: payment.reference_id,
      type: payment.type,
      status: payment.status,
      due_payment_timestamp: payment.due_payment_timestamp?.toISOString() || null,
      created_at: payment.created_at.toISOString(),
      payment_evidence: payment.payment_evidence,
      lease: payment.leases ? {
        id: payment.leases.id,
        reference_id: payment.leases.reference_id,
        monthly_rent: payment.leases.monthly_rent.toNumber(),
        payment_day: payment.leases.payment_day,
        property: payment.leases.properties ? {
          id: payment.leases.properties.id,
          code: payment.leases.properties.code,
          street_address: payment.leases.properties.street_address,
          city: payment.leases.properties.city
        } : { id: '', code: 'N/A', street_address: '', city: '' },
        room: payment.leases.rooms,
        tenant: {
          id: tenantData?.id || '',
          type: tenantData?.type || '',
          profile_pic: tenantData?.profile_pic || null,
          name: tenantName,
          phone: tenantPhone,
          email: tenantEmail
        }
      } : null,
      charges: transformedCharges,
      payment_history: transformedHistory,
      recurring_config: payment.recurring_configs,
      total_amount: totalAmount,
      total_paid: totalPaid,
      remaining_amount: remainingAmount,
      payment_percentage: paymentPercentage
    }
  } catch (error) {
    console.error('Error fetching payment details:', error)
    return null
  }
}

async function getUserType(): Promise<'staff' | 'tenant'> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 'staff'

  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { id: true }
  })

  return staff ? 'staff' : 'tenant'
}

export default async function PaymentDetailsPage({ params }: Props) {
  const { id } = await params
  const [payment, userType] = await Promise.all([
    getPaymentDetails(id),
    getUserType()
  ])

  if (!payment) {
    notFound()
  }

  return <PaymentDetailsContent payment={payment} userType={userType} />
}
