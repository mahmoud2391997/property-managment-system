import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { Payment } from '@/types'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { PaymentsPageWrapper } from '@/components/payments-page-wrapper'
import PaymentsSection from '@/components/sections/payments-section'

async function fetchPayments(): Promise<{ payments: Payment[], userType: 'staff' | 'tenant' }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { payments: [], userType: 'staff' }
    }

    // Check if user is staff
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    // Check if user is tenant
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!staff && !tenant) {
      return { payments: [], userType: 'staff' }
    }

    const userType = staff ? 'staff' : 'tenant'

    const payments = await prisma.payments.findMany({
      where: staff
        ? { organization_id: staff.organization_id }
        : {
            leases: {
              tenant_id: tenant!.id
            }
          },
      include: {
        leases: {
          include: {
            properties: {
              select: {
                code: true,
                projects: {
                  select: {
                    title: true
                  }
                }
              }
            },
            rooms: {
              select: {
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
                    last_name: true
                  }
                },
                company_tenants: {
                  select: {
                    company_name: true
                  }
                }
              }
            }
          }
        },
        charges: {
          select: {
            amount: true,
            is_taxed: true
          }
        },
        payment_history: {
          select: {
            amount: true,
            paid_at: true,
            status: true
          },
          orderBy: {
            paid_at: 'desc'
          }
        },
        recurring_configs: {
          select: {
            every: true,
            time_unit: true,
            event_on: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    const transformedPayments: Payment[] = payments.map(payment => {
      const totalAmount = payment.charges.reduce((sum: number, charge: any) => {
        const amount = charge.amount
        const tax = charge.is_taxed ? amount * 0.08 : 0
        return sum + amount + tax
      }, 0)

      // Only count SUCCESS payments in total paid
      const totalPaid = payment.payment_history
        .filter((history: any) => history.status === 'Success')
        .reduce((sum: number, history: any) => sum + history.amount, 0)
      const paymentPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

      // Check if there are any Pending payment_history records
      const hasPendingPayments = payment.payment_history.some((history: any) => history.status === 'Pending')

      let status: 'Paid' | 'Paid Late' | 'Pending' | 'Overdue' = payment.status as any

      const recurringConfig = payment.recurring_configs[0]
      const isRecurring = recurringConfig ? true : false
      let recurringDescription = ''

      if (recurringConfig) {
        const { every, time_unit, event_on } = recurringConfig
        if (time_unit === 'Week' && event_on) {
          const days = event_on.split(',').join(', ')
          recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on ${days}`
        } else if (time_unit === 'Month' && event_on) {
          const days = event_on.split(',').join(', ')
          recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on day ${days}`
        } else {
          recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''}`
        }
      }

      // Get tenant name based on type
      const tenant = payment.leases?.tenants
      let tenantName = 'N/A'
      if (tenant) {
        if (tenant.type === 'Individual' && tenant.individual_tenants) {
          tenantName = `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
        } else if (tenant.type === 'Company' && tenant.company_tenants) {
          tenantName = tenant.company_tenants.company_name
        }
      }

      // Get latest payment timestamp
      const latestPaymentTimestamp = payment.payment_history[0]?.paid_at?.toISOString() || payment.created_at.toISOString()

      return {
        id: payment.reference_id,
        type: payment.type,
        property: payment.leases?.properties?.code || 'N/A',
        room: payment.leases?.rooms?.title || 'Whole unit',
        due_date: payment.due_payment_timestamp,
        recurring_pattern: (isRecurring ? 'Recurring' : 'One-time') as 'Recurring' | 'One-time',
        recurring_pattern_description: recurringDescription,
        amount: totalAmount,
        status: status,
        payment_percentage: paymentPercentage,
        has_pending_payments: hasPendingPayments,
        tenant_name: tenantName,
        tenant_picture: tenant?.profile_pic || '',
        tenant_color: '',
        latest_payment_timestamp: latestPaymentTimestamp
      }
    })

    return { payments: transformedPayments, userType }
  } catch (error) {
    console.error('Error fetching payments:', error)
    return { payments: [], userType: 'staff' }
  }
}

const Payments = async () => {
  const { payments, userType } = await fetchPayments()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentsPageWrapper>
        <div className={cn('flex flex-col gap-2.5', 'h-full')}>
          {/* Heading */}
          <div>
            <h1>Payments</h1>
          </div>
          <PaymentsSection payments={payments} userType={userType} />
        </div>
      </PaymentsPageWrapper>
    </Suspense>
  )
}

export default Payments
