export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { PaymentsPageWrapper } from '@/components/payments-page-wrapper'
import PaymentsSection from '@/components/sections/payments-section'
import { transformPayment, PaymentWithDetails } from '@/lib/payments-utils'
import TablePageSkeleton from '@/components/loading-ui/table-page-skeleton'
import { payment_status } from '@prisma/client'
import { PaymentSummary } from '@/components/costume-ui/payall-ui'


const PAGE_SIZE = 10

// Shared select for payment queries
const paymentSelect = {
  reference_id: true,
  type: true,
  status: true,
  due_payment_timestamp: true,
  created_at: true,
  leases: {
    select: {
      property_id: true,
      room_id: true,
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
    orderBy: {
      paid_at: 'desc' as const
    },
    select: {
      paid_at: true,
      amount: true,
      status: true
    }
  },
  recurring_configs: {
    select: {
      every: true,
      time_unit: true,
      event_on: true
    }
  }
}

async function getPayments (): Promise<{
  data: PaymentWithDetails[]
  total: number
  userType: 'staff' | 'tenant'
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], total: 0, userType: 'staff' }
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
      return { data: [], total: 0, userType: 'staff' }
    }

    const userType = staff ? 'staff' : 'tenant'

    const whereClause = staff
      ? { organization_id: staff.organization_id, status: { not: payment_status.Unset } }
      : { leases: { tenant_id: tenant!.id }, status: { not: payment_status.Unset } }

    // Fetch first page of payments and total count in parallel
    const [payments, total] = await Promise.all([
      prisma.payments.findMany({
        where: whereClause,
        select: paymentSelect,
        orderBy: { created_at: 'desc' },
        take: PAGE_SIZE
      }),
      prisma.payments.count({ where: whereClause })
    ])

    return {
      data: payments.map(transformPayment),
      total,
      userType
    }
  } catch (error) {
    console.error('Error fetching payments:', error)
    return { data: [], total: 0, userType: 'staff' }
  }
}

const Payments = async () => {
  const {
    data: initialData,
    total: initialTotal,
    userType
  } = await getPayments()

  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <PaymentsPageWrapper>
        <div className={cn('flex flex-col gap-2.5', 'h-full')}>
          {/* Heading */}
          <div>
            <h1>Payments</h1>
          </div>
          <PaymentsSection
            initialData={initialData}
            initialTotal={initialTotal}
            userType={userType}
          />
          {userType === 'tenant' && <PaymentSummary />}
        </div>

      </PaymentsPageWrapper>
    </Suspense>
  )
}

export default Payments
