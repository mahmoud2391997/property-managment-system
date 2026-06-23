import { hasPermission } from '@/lib/has-permission'
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
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

export type LateChargeInfo = {
  days_overdue: number
  applied_at: string
  rental_payment?: {
    reference_id: string
    due_payment_timestamp: string | null
  }
  lease?: {
    reference_id: string
  }
  property?: {
    street_address: string
  }
  room?: {
    title: string
  } | null
}

export type PaymentDetailsData = {
  id: string
  reference_id: string
  type: string
  status: string
  due_payment_timestamp: string | null
  created_at: string
  payment_evidence: string | null
  lease?: {
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
  late_charge_info?: LateChargeInfo | null
  total_amount: number
  total_paid: number
  remaining_amount: number
  payment_percentage: number
  can_edit: boolean
  fpx_cooling_remaining_minutes: number | null
}

async function getPaymentDetails(referenceId: string): Promise<PaymentDetailsData | null> {
  try {
    const { data: { user } } = 

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

    // Get user permissions for staff users
    let canAccessTenants = false
    let canAccessProperties = false
    let canAccessLeases = false
    
    if (staff) {
      // Use the existing permission system by checking the user's permissions
      const { permissions: userPermissions } = await getUserAndStaff()
      
      canAccessTenants = Array.isArray(userPermissions) && userPermissions.some((p: any) => p.permission === 'tenants.access')
      canAccessProperties = Array.isArray(userPermissions) && userPermissions.some((p: any) => p.permission === 'properties.access')
      canAccessLeases = Array.isArray(userPermissions) && userPermissions.some((p: any) => p.permission === 'leases.access')
    }

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
            // Only include lease data if user has lease access permission
            ...(canAccessLeases && {
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
                  // Only include detailed tenant info if user has tenant access permission
                  ...(canAccessTenants && {
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
                    }
                  })
                }
              }
            })
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
        },
        // For late payment charges, get the original rental payment info
        payment_late_charges_applied_payment_late_charges_applied_late_charge_payment_idTopayments: {
          select: {
            days_overdue_when_applied: true,
            applied_at: true,
            payments_payment_late_charges_applied_rental_payment_idTopayments: {
              select: {
                reference_id: true,
                due_payment_timestamp: true,
                leases: {
                  select: {
                    reference_id: true,
                    properties: {
                      select: {
                        street_address: true
                      }
                    },
                    rooms: {
                      select: {
                        title: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!payment) return null

    // Check for pending FPX payments within 20-minute cooling period
    const pendingFpxHistory = await prisma.payment_history.findFirst({
      where: {
        payment_id: payment.id,
        status: 'Pending',
        payment_method: 'FPX',
        created_at: { gte: new Date(Date.now() - 20 * 60 * 1000) }
      },
      select: { id: true, created_at: true }
    })

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
      if (tenantData.type === 'Individual' && (tenantData as any).individual_tenants && canAccessTenants) {
        const individualTenant = (tenantData as any).individual_tenants
        tenantName = `${individualTenant.first_name} ${individualTenant.last_name || ''}`.trim()
        tenantPhone = individualTenant.phone_number || null
      } else if (tenantData.type === 'Company' && (tenantData as any).company_tenants && canAccessTenants) {
        const companyTenant = (tenantData as any).company_tenants
        tenantName = companyTenant.company_name
      } else {
        // If no tenant access, show limited info
        tenantName = `Tenant ${tenantData.id.slice(0, 8)}...` // Show partial ID instead of name
      }
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
      // Build lease data based on permissions
      lease: canAccessLeases && payment.leases ? {
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
      } : undefined,
      charges: transformedCharges,
      payment_history: transformedHistory,
      recurring_config: payment.recurring_configs,
      // Build late charge info based on permissions
late_charge_info: (() => {
        const lateChargeRecord = payment.payment_late_charges_applied_payment_late_charges_applied_late_charge_payment_idTopayments?.[0]
        if (!lateChargeRecord || !canAccessLeases) return undefined

        const rentalPayment = lateChargeRecord.payments_payment_late_charges_applied_rental_payment_idTopayments
        const lease = rentalPayment?.leases

        return {
          days_overdue: lateChargeRecord.days_overdue_when_applied,
          applied_at: lateChargeRecord.applied_at.toISOString(),
          ...(rentalPayment && {
            rental_payment: {
              reference_id: rentalPayment.reference_id || '',
              due_payment_timestamp: rentalPayment.due_payment_timestamp?.toISOString() || null
            }
          }),
          ...(lease && {
            lease: {
              reference_id: lease.reference_id || ''
            },
            property: {
              street_address: lease.properties?.street_address || ''
            },
            room: lease.rooms ? { title: lease.rooms.title } : null
          })
        }
      })(),
      total_amount: totalAmount,
      total_paid: totalPaid,
      remaining_amount: remainingAmount,
      payment_percentage: paymentPercentage,
      can_edit: payment.type !== 'Rental'
        && payment.payment_history.length === 0
        && payment.status !== 'Cancelled',
      fpx_cooling_remaining_minutes: pendingFpxHistory?.created_at
        ? Math.ceil((20 * 60 * 1000 - (Date.now() - new Date(pendingFpxHistory.created_at).getTime())) / 60000)
        : null
    }
  } catch (error) {
    console.error('Error fetching payment details:', error)
    return null
  }
}

async function getUserType(): Promise<'staff' | 'tenant'> {
  const { data: { user } } = 

  if (!user) return 'staff'

  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { id: true }
  })

  return staff ? 'staff' : 'tenant'
}

export default async function PaymentDetailsPage({ params }: Props) {
  const userType = await getUserType()
  
  if (userType !== 'tenant') {
    await requirePermission('payments.access')
  }

  const { id } = await params
  const [payment] = await Promise.all([
    getPaymentDetails(id),
  ])

  console.log('Payment details response:', payment)
  
  if (!payment) {
    notFound()
  }

  return <PaymentDetailsContent payment={payment} userType={userType} />
}
